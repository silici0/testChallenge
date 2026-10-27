import { setupWorker } from 'msw/browser'
import type { io as ioFactory, Socket } from 'socket.io-client'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import {
  authResponseSchema,
  cartSchema,
  nftDetailSchema,
  orderSchema,
  quoteSchema,
  type RealtimeEvent,
  walletSchema,
} from '@/contracts'
import { createHttpClient } from '@/shared/api'

import { DEMO_PASSWORD } from './fixtures/users'
import { createMockServer, type MockServer } from './server'

const API = '/api/v1'
const EMERALD = 'nft_emerald-ape-042'
const EDITION = 'ed_emerald-ape-042_aberta'

let server: MockServer
let worker: ReturnType<typeof setupWorker>
let io: typeof ioFactory

beforeAll(async () => {
  server = await createMockServer({
    apiBase: API,
    requestTimeoutMs: 2000,
    socketUrl: location.origin,
    storage: null,
    defaultScenario: 'default',
  })
  worker = setupWorker(...server.handlers)
  await worker.start({ quiet: true, onUnhandledRequest: 'bypass' })
  // Importado só depois do MSW ativo (ADR-0024).
  io = (await import('socket.io-client')).io
})
afterAll(() => {
  worker.stop()
})
beforeEach(async () => {
  await fetch('/__mock/reset', { method: 'POST', body: JSON.stringify({ id: 'default' }) })
})

const client = (auth: { token?: string } = {}) =>
  createHttpClient({ baseURL: API, timeoutMs: 2000, getAuth: () => auth, onSessionExpired: () => undefined })

async function loginAs(email: string) {
  const { session } = await client().request({
    method: 'POST',
    url: '/auth/login',
    data: { email, password: DEMO_PASSWORD },
    schema: authResponseSchema,
  })
  return { token: session.token, api: client({ token: session.token }) }
}

function connect(token: string | null) {
  const socket: Socket = io(location.origin, {
    transports: ['websocket'],
    query: token ? { token } : {},
    forceNew: true,
  })
  const events: RealtimeEvent[] = []
  for (const type of ['nft.updated', 'order.updated', 'wallet.updated'])
    socket.on(type, (event: RealtimeEvent) => events.push(event))
  return new Promise<{ socket: Socket; events: RealtimeEvent[] }>((resolve) =>
    socket.on('connect', () => resolve({ socket, events })),
  )
}

const waitFor = async (check: () => boolean, timeoutMs = 3000) => {
  const start = Date.now()
  while (!check()) {
    if (Date.now() - start > timeoutMs) throw new Error('condição não satisfeita a tempo')
    await new Promise((resolve) => setTimeout(resolve, 25))
  }
}

describe('servidor simulado (REST + Socket.IO) no navegador', () => {
  it('compra completa com idempotência e evento privado só para o dono', async () => {
    const ana = await loginAs('ana@example.test')
    const bruno = await loginAs('bruno@example.test')
    const anaSocket = await connect(ana.token)
    const brunoSocket = await connect(bruno.token)

    await ana.api.request({
      method: 'POST',
      url: '/cart/items',
      data: { nftId: EMERALD, editionId: EDITION, quantity: 2 },
      schema: cartSchema,
    })
    await ana.api.request({
      method: 'POST',
      url: '/me/wallets/wal_ana-primary/connect',
      data: { network: 'ethereum' },
      schema: walletSchema,
    })
    const quote = await ana.api.request({
      method: 'POST',
      url: '/quotes',
      data: { network: 'ethereum' },
      schema: quoteSchema,
    })

    const body = {
      quoteId: quote.id,
      walletId: 'wal_ana-primary',
      network: 'ethereum',
      buyer: {
        displayName: 'Ana',
        username: 'ana.collector',
        email: 'ana@example.test',
        referralCode: null,
        note: null,
      },
    }
    const place = () =>
      ana.api.request({
        method: 'POST',
        url: '/orders',
        data: body,
        headers: { 'Idempotency-Key': 'key-1' },
        schema: orderSchema,
      })
    const [first, retry] = [await place(), await place()]
    expect(first.status).toBe('pending')
    expect(retry.id).toBe(first.id)

    await fetch(`/__mock/orders/${first.id}/resolve`, { method: 'POST', body: JSON.stringify({ status: 'confirmed' }) })
    await waitFor(() => anaSocket.events.some((event) => event.type === 'order.updated'))

    const confirmed = await ana.api.request({ method: 'GET', url: `/orders/${first.id}`, schema: orderSchema })
    expect(confirmed).toMatchObject({ status: 'confirmed', transaction: { simulated: true } })
    expect(brunoSocket.events.filter((event) => event.type === 'order.updated')).toEqual([])
    expect(brunoSocket.events.some((event) => event.type === 'nft.updated')).toBe(true) // evento público

    const error = await bruno.api
      .request({ method: 'GET', url: `/orders/${first.id}`, schema: orderSchema })
      .catch((caught: unknown) => caught)
    expect(error).toMatchObject({ code: 'FORBIDDEN' })
    anaSocket.socket.close()
    brunoSocket.socket.close()
  })

  it('alteração no catálogo aparece no REST e no evento com a mesma versão', async () => {
    const visitor = await connect(null)
    await fetch(`/__mock/nfts/${EMERALD}`, {
      method: 'POST',
      body: JSON.stringify({ editionId: EDITION, priceEth: '0.5' }),
    })
    await waitFor(() => visitor.events.length > 0)

    const detail = await client().request({ method: 'GET', url: `/nfts/${EMERALD}`, schema: nftDetailSchema })
    expect(detail.editions.find((edition) => edition.id === EDITION)?.priceEth).toBe('0.5')
    expect(visitor.events[0]).toMatchObject({ type: 'nft.updated', resource: { id: EMERALD }, version: detail.version })
    visitor.socket.close()
  })

  it('cenário session-expired: a próxima requisição privada responde SESSION_EXPIRED', async () => {
    const ana = await loginAs('ana@example.test')
    await fetch('/__mock/scenario', { method: 'PUT', body: JSON.stringify({ id: 'session-expired' }) })
    const error = await ana.api
      .request({ method: 'GET', url: '/me/profile', schema: z.unknown() })
      .catch((caught: unknown) => caught)
    expect(error).toMatchObject({ code: 'SESSION_EXPIRED', status: 401 })
  })

  it('carrinho do visitante é mesclado no login', async () => {
    const guest = createHttpClient({
      baseURL: API,
      timeoutMs: 2000,
      getAuth: () => ({ guestCartId: 'guest-xyz' }),
      onSessionExpired: () => undefined,
    })
    await guest.request({
      method: 'POST',
      url: '/cart/items',
      data: { nftId: EMERALD, editionId: EDITION, quantity: 1 },
      schema: cartSchema,
    })
    const auth = await client().request({
      method: 'POST',
      url: '/auth/login',
      data: { email: 'bruno@example.test', password: DEMO_PASSWORD, guestCartId: 'guest-xyz' },
      schema: authResponseSchema,
    })
    const cart = await client({ token: auth.session.token }).request({
      method: 'GET',
      url: '/cart',
      schema: cartSchema,
    })
    expect(cart.items.map((item) => item.editionId)).toEqual([EDITION])
  })
})
