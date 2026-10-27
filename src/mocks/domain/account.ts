import type {
  ChangePasswordBody,
  FavoritesResponse,
  Profile,
  UpdateProfileBody,
  Wallet,
  WalletInput,
} from '@/contracts'

import { nextId } from '../db/runtime'
import type { DbState, UserRecord, WalletRecord } from '../db/schema'
import { assertUniqueIdentity } from './auth'
import { findNft, toNftSummary } from './catalog'
import { fail, requireFound } from './context'
import { createSalt, hashPassword, verifyPassword } from './password'

// Favoritos ---------------------------------------------------------------------------------------

export function getFavorites(db: DbState, userId: string): FavoritesResponse {
  const nftIds = db.favorites[userId] ?? []
  return { nftIds, items: nftIds.map((id) => toNftSummary(findNft(db, id))) }
}

export function setFavorite(
  db: DbState,
  userId: string,
  { nftId, favorite }: { nftId: string; favorite: boolean },
): void {
  findNft(db, nftId)
  const current = new Set(db.favorites[userId] ?? [])
  if (favorite) current.add(nftId)
  else current.delete(nftId)
  db.favorites[userId] = [...current]
}

// Perfil ------------------------------------------------------------------------------------------

export const toProfileDto = (user: UserRecord): Profile => ({
  id: user.id,
  displayName: user.displayName,
  username: user.username,
  email: user.email,
  ensName: user.ensName,
  walletNickname: user.walletNickname,
  avatarUrl: user.avatarUrl,
  version: user.version,
})

export function updateProfile(db: DbState, user: UserRecord, body: UpdateProfileBody): Profile {
  assertUniqueIdentity(db, body, user.id)
  Object.assign(user, { ...body, email: body.email.toLowerCase() })
  user.version += 1
  return toProfileDto(user)
}

export function setAvatar(user: UserRecord, avatarUrl: string | null): Profile {
  user.avatarUrl = avatarUrl
  user.version += 1
  return toProfileDto(user)
}

export async function changePassword(user: UserRecord, body: ChangePasswordBody): Promise<void> {
  if (!(await verifyPassword(body.currentPassword, user.passwordSalt, user.passwordHash))) {
    fail('VALIDATION_ERROR', 'Senha atual incorreta', { fieldErrors: { currentPassword: ['Senha atual incorreta'] } })
  }
  user.passwordSalt = createSalt()
  user.passwordHash = await hashPassword(body.newPassword, user.passwordSalt)
  user.version += 1
}

// Carteiras ---------------------------------------------------------------------------------------

export const toWalletDto = ({ userId: _userId, ...wallet }: WalletRecord): Wallet => wallet

export const listWallets = (db: DbState, userId: string) =>
  db.wallets.filter((wallet) => wallet.userId === userId).map(toWalletDto)

export function findOwnWallet(db: DbState, userId: string, walletId: string): WalletRecord {
  const wallet = requireFound(
    db.wallets.find((candidate) => candidate.id === walletId),
    'Carteira',
  )
  if (wallet.userId !== userId) fail('FORBIDDEN', 'Carteira de outro usuário')
  return wallet
}

export function createWallet(db: DbState, userId: string, input: WalletInput): Wallet {
  if (db.wallets.some((wallet) => wallet.userId === userId && wallet.role === input.role)) {
    const label = input.role === 'primary' ? 'principal' : 'secundária'
    fail('WALLET_ROLE_TAKEN', `Você já tem uma carteira ${label}`, {
      fieldErrors: { role: [`Carteira ${label} já cadastrada`] },
    })
  }
  const wallet: WalletRecord = { ...input, id: nextId(db, 'wal'), userId, connection: 'disconnected', version: 1 }
  db.wallets.push(wallet)
  return toWalletDto(wallet)
}

export function updateWallet(
  db: DbState,
  userId: string,
  { walletId, input }: { walletId: string; input: WalletInput },
): Wallet {
  const wallet = findOwnWallet(db, userId, walletId)
  const changedNetwork = wallet.network !== input.network || wallet.address !== input.address
  Object.assign(wallet, {
    ...input,
    role: wallet.role,
    connection: changedNetwork ? 'disconnected' : wallet.connection,
  })
  wallet.version += 1
  return toWalletDto(wallet)
}

export function setWalletConnection(
  db: DbState,
  userId: string,
  { walletId, connection }: { walletId: string; connection: WalletRecord['connection'] },
): WalletRecord {
  const wallet = findOwnWallet(db, userId, walletId)
  wallet.connection = connection
  wallet.version += 1
  return wallet
}
