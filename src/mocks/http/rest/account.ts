import {
  AVATAR_MAX_BYTES,
  AVATAR_TYPES,
  changePasswordBodySchema,
  connectWalletBodySchema,
  updateProfileBodySchema,
  walletInputSchema,
} from '@/contracts'

import {
  changePassword,
  createWallet,
  findOwnWallet,
  getFavorites,
  listWallets,
  setAvatar,
  setFavorite,
  setWalletConnection,
  toProfileDto,
  toWalletDto,
  updateProfile,
  updateWallet,
} from '../../domain/account'
import { fail } from '../../domain/context'
import { createRoute, type MockServices } from '../responder'

async function readAvatar(request: Request): Promise<string> {
  const form = await request.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof Blob))
    return fail('VALIDATION_ERROR', 'Envie uma imagem', { fieldErrors: { file: ['Envie uma imagem'] } })
  if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) {
    fail('VALIDATION_ERROR', 'Formato inválido', { fieldErrors: { file: ['Use PNG, JPEG ou WebP'] } })
  }
  if (file.size > AVATAR_MAX_BYTES)
    fail('VALIDATION_ERROR', 'Arquivo grande', { fieldErrors: { file: ['Máximo de 2 MB'] } })
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return `data:${file.type};base64,${btoa(binary)}`
}

export function accountRoutes(services: MockServices) {
  const { privateRoute } = createRoute(services)
  const { db } = services
  return [
    // Favoritos
    privateRoute('get', '/me/favorites', async ({ requireUser }) => {
      const user = await requireUser()
      return db.read((state) => getFavorites(state, user.id))
    }),
    privateRoute('put', '/me/favorites/:nftId', async ({ requireUser, params }) => {
      const user = await requireUser()
      await db.transaction(({ db: state }) => {
        setFavorite(state, user.id, { nftId: String(params.nftId), favorite: true })
      })
      return { status: 204 }
    }),
    privateRoute('delete', '/me/favorites/:nftId', async ({ requireUser, params }) => {
      const user = await requireUser()
      await db.transaction(({ db: state }) => {
        setFavorite(state, user.id, { nftId: String(params.nftId), favorite: false })
      })
      return { status: 204 }
    }),
    // Perfil
    privateRoute('get', '/me/profile', async ({ requireUser }) => toProfileDto(await requireUser())),
    privateRoute('patch', '/me/profile', async ({ requireUser, json }) => {
      const user = await requireUser()
      const body = updateProfileBodySchema.parse(await json())
      return db.transaction(({ db: state }) => updateProfile(state, user, body))
    }),
    privateRoute('put', '/me/avatar', async ({ requireUser, request }) => {
      const user = await requireUser()
      const avatarUrl = await readAvatar(request)
      return db.transaction(() => setAvatar(user, avatarUrl))
    }),
    privateRoute('delete', '/me/avatar', async ({ requireUser }) => {
      const user = await requireUser()
      return db.transaction(() => setAvatar(user, null))
    }),
    privateRoute('post', '/me/password', async ({ requireUser, json }) => {
      const user = await requireUser()
      const body = changePasswordBodySchema.parse(await json())
      await db.transaction(() => changePassword(user, body))
      return { status: 204 }
    }),
    // Carteiras
    privateRoute('get', '/me/wallets', async ({ requireUser }) => {
      const user = await requireUser()
      return db.read((state) => ({ items: listWallets(state, user.id) }))
    }),
    privateRoute('post', '/me/wallets', async ({ requireUser, json }) => {
      const user = await requireUser()
      const input = walletInputSchema.parse(await json())
      return { status: 201, body: await db.transaction(({ db: state }) => createWallet(state, user.id, input)) }
    }),
    privateRoute('patch', '/me/wallets/:walletId', async ({ requireUser, json, params }) => {
      const user = await requireUser()
      const input = walletInputSchema.parse(await json())
      return db.transaction(({ db: state }) =>
        updateWallet(state, user.id, { walletId: String(params.walletId), input }),
      )
    }),
    privateRoute('post', '/me/wallets/:walletId/connect', async ({ requireUser, json, params }) => {
      const user = await requireUser()
      const walletId = String(params.walletId)
      const { network } = connectWalletBodySchema.parse(await json())
      const { scenario } = services.scenarios
      const wallet = db.read((state) => findOwnWallet(state, user.id, walletId))
      if (wallet.network !== network)
        fail('VALIDATION_ERROR', 'Rede não suportada por esta carteira', {
          fieldErrors: { network: ['Selecione a rede da carteira'] },
        })
      if (scenario.rejectWalletConnection) fail('WALLET_REJECTED', 'Conexão recusada na carteira (simulado)')
      const connected = await db.transaction(({ db: state }) =>
        setWalletConnection(state, user.id, { walletId, connection: 'connected' }),
      )
      if (scenario.disconnectWalletAfterMs)
        services.effects.scheduleWalletDisconnect(user.id, walletId, scenario.disconnectWalletAfterMs)
      return toWalletDto(connected)
    }),
    privateRoute('post', '/me/wallets/:walletId/disconnect', async ({ requireUser, params }) => {
      const user = await requireUser()
      return toWalletDto(
        await db.transaction(({ db: state }) =>
          setWalletConnection(state, user.id, { walletId: String(params.walletId), connection: 'disconnected' }),
        ),
      )
    }),
  ]
}
