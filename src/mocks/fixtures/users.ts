import type { CouponRecord, UserRecord, WalletRecord } from '../db/schema'
import { hashPassword } from '../domain/password'

/** Credenciais fictícias documentadas no README. */
export const DEMO_PASSWORD = 'Jungle#2026'

const USERS = [
  {
    id: 'usr_ana',
    displayName: 'Ana Collector',
    username: 'ana.collector',
    email: 'ana@example.test',
    ensName: 'ana',
    walletNickname: 'Cofre da Ana',
  },
  {
    id: 'usr_bruno',
    displayName: 'Bruno Holder',
    username: 'bruno.holder',
    email: 'bruno@example.test',
    ensName: null,
    walletNickname: null,
  },
  {
    id: 'usr_taken',
    displayName: 'Conta existente',
    username: 'taken',
    email: 'taken@example.test',
    ensName: null,
    walletNickname: null,
  },
] as const

export async function createUserFixtures(): Promise<UserRecord[]> {
  return Promise.all(
    USERS.map(async (user) => {
      const salt = `seed-salt-${user.id}`
      return {
        ...user,
        passwordSalt: salt,
        passwordHash: await hashPassword(DEMO_PASSWORD, salt),
        avatarUrl: null,
        version: 1,
      }
    }),
  )
}

export function createWalletFixtures(): WalletRecord[] {
  return [
    {
      id: 'wal_ana-primary',
      userId: 'usr_ana',
      role: 'primary',
      displayName: 'Principal',
      nickname: 'Cofre da Ana',
      network: 'ethereum',
      address: '0xA91F2c3b4D5e6F708192a3B4c5D6e7F80912E82C',
      provider: 'metamask',
      ensName: 'ana',
      connection: 'disconnected',
      version: 1,
    },
    {
      id: 'wal_ana-secondary',
      userId: 'usr_ana',
      role: 'secondary',
      displayName: 'Reserva',
      nickname: 'nova.kurio',
      network: 'polygon',
      address: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
      provider: 'walletconnect',
      ensName: null,
      connection: 'disconnected',
      version: 1,
    },
    {
      id: 'wal_bruno-primary',
      userId: 'usr_bruno',
      role: 'primary',
      displayName: 'Principal',
      nickname: null,
      network: 'ethereum',
      address: '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2',
      provider: 'coinbase',
      ensName: null,
      connection: 'disconnected',
      version: 1,
    },
  ]
}

export function createCouponFixtures(): CouponRecord[] {
  return [
    {
      code: 'JUNGLE10',
      basisPoints: 1000,
      minSubtotalEth: '0',
      expiresAt: '2099-12-31T23:59:59.000Z',
      description: '10% de desconto',
    },
    {
      code: 'WELCOME5',
      basisPoints: 500,
      minSubtotalEth: '0.5',
      expiresAt: '2099-12-31T23:59:59.000Z',
      description: '5% para pedidos a partir de 0.5 ETH',
    },
    {
      code: 'EXPIRED20',
      basisPoints: 2000,
      minSubtotalEth: '0',
      expiresAt: '2025-01-01T00:00:00.000Z',
      description: '20% de desconto (expirado)',
    },
  ]
}
