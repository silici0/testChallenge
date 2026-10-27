import { describe, expect, it } from 'vitest'

import { registerBodySchema } from './auth'
import { ethSchema, networkSchema, passwordSchema } from './common'
import { apiErrorBodySchema } from './errors'
import { realtimeEventSchema } from './events'
import { nftListParamsSchema } from './nft'
import { createOrderBodySchema } from './order'
import { walletInputSchema } from './wallet'

describe('common', () => {
  it('ETH é string decimal com até 18 casas', () => {
    expect(ethSchema.safeParse('1.19').success).toBe(true)
    expect(ethSchema.safeParse(1.19).success).toBe(false)
    expect(ethSchema.safeParse('1e3').success).toBe(false)
  })

  it('redes do Figma', () => {
    expect(networkSchema.options).toEqual(['ethereum', 'polygon', 'solana'])
  })

  it('política de senha: 8+ caracteres, maiúscula, minúscula, número e símbolo', () => {
    expect(passwordSchema.safeParse('Jungle#2026').success).toBe(true)
    expect(passwordSchema.safeParse('jungle2026').success).toBe(false)
  })
})

describe('auth', () => {
  it('cadastro exige confirmação de senha igual', () => {
    const result = registerBodySchema.safeParse({
      username: 'ana.collector',
      email: 'ana@example.test',
      password: 'Jungle#2026',
      confirmPassword: 'Outra#2026',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['confirmPassword'])
  })
})

describe('nft list params', () => {
  it('normaliza a URL: defaults, arrays e página inválida', () => {
    expect(nftListParamsSchema.parse({ page: 'abc', category: 'musica' })).toEqual({
      tab: 'all',
      sort: 'recent',
      page: 1,
      pageSize: 9,
      category: ['musica'],
      network: [],
    })
  })
})

describe('wallet', () => {
  it('valida endereço conforme a rede', () => {
    const base = {
      role: 'primary',
      displayName: 'Principal',
      provider: 'metamask',
      nickname: null,
      ensName: null,
    } as const
    expect(
      walletInputSchema.safeParse({
        ...base,
        network: 'ethereum',
        address: '0xA91F00000000000000000000000000000000E82C',
      }).success,
    ).toBe(true)
    expect(walletInputSchema.safeParse({ ...base, network: 'ethereum', address: '0x123' }).success).toBe(false)
    expect(
      walletInputSchema.safeParse({
        ...base,
        network: 'solana',
        address: '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV',
      }).success,
    ).toBe(true)
  })

  it('ENS só é aceito na Ethereum (comentário #18 do Figma)', () => {
    const result = walletInputSchema.safeParse({
      role: 'secondary',
      displayName: 'Reserva',
      provider: 'walletconnect',
      nickname: null,
      network: 'polygon',
      address: '0xA91F00000000000000000000000000000000E82C',
      ensName: 'ana',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['ensName'])
  })
})

describe('orders', () => {
  it('corpo de criação de pedido', () => {
    expect(
      createOrderBodySchema.safeParse({
        quoteId: 'qt_1',
        walletId: 'wal_1',
        network: 'ethereum',
        buyer: { displayName: 'Ana', username: 'ana', email: 'ana@example.test', referralCode: null, note: null },
      }).success,
    ).toBe(true)
  })
})

describe('errors', () => {
  it('envelope padrão com fieldErrors', () => {
    expect(
      apiErrorBodySchema.safeParse({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'x',
          fieldErrors: { email: ['inválido'] },
          retryable: false,
          requestId: 'req_1',
        },
      }).success,
    ).toBe(true)
  })
})

describe('events', () => {
  it('discrimina nft.updated e order.updated com identidade e versão', () => {
    const event = realtimeEventSchema.parse({
      eventId: 'evt_1',
      type: 'order.updated',
      resource: { type: 'order', id: 'ord_1' },
      version: 2,
      occurredAt: '2026-01-15T12:00:00.000Z',
      userId: 'usr_1',
      data: {
        status: 'confirmed',
        declineReason: null,
        transaction: { hash: '0xabc', explorerUrl: '/explorer/tx/0xabc', simulated: true },
      },
    })
    expect(event.type).toBe('order.updated')
  })
})
