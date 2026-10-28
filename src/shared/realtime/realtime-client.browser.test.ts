import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import { setupWorker } from 'msw/browser'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'

import type { RealtimeEvent } from '@/contracts'

import { createRealtimeClient } from './realtime-client'

const origin = `ws://${location.host}`
const subscriptions: unknown[] = []
const handshakeTokens: (string | null)[] = []
const servers = new Set<{ emit: (type: string, payload: unknown) => void; close: () => void }>()
/** Servidor fora do ar: recusa novas conexões (como `/__mock/socket/drop`). */
let refusing = false

const worker = setupWorker(
  ws.link(origin).addEventListener('connection', (connection) => {
    if (refusing) {
      connection.client.close()
      return
    }
    handshakeTokens.push(connection.client.url.searchParams.get('token'))
    const io = toSocketIo(connection)
    const server = {
      emit: (type: string, payload: unknown) => io.client.emit(type, payload),
      close: () => connection.client.close(),
    }
    servers.add(server)
    connection.client.addEventListener('close', () => servers.delete(server))
    io.client.on('nft.subscribe', (_event, payload: unknown) => subscriptions.push(payload))
  }),
)

beforeAll(async () => {
  await worker.start({ quiet: true, onUnhandledRequest: 'bypass' })
})
afterAll(() => {
  worker.stop()
})

const until = async (check: () => boolean, timeoutMs = 4000) => {
  const start = Date.now()
  while (!check()) {
    if (Date.now() - start > timeoutMs) throw new Error('timeout')
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
}

const event: RealtimeEvent = {
  eventId: 'evt_1',
  type: 'nft.updated',
  resource: { type: 'nft', id: 'nft_a' },
  version: 2,
  occurredAt: '2026-01-15T12:00:00.000Z',
  userId: null,
  data: { priceFromEth: '1', available: 1, editions: [] },
}

it('conecta, valida eventos pelo contrato, reassina NFTs e reconcilia após reconexão', async () => {
  const onEvent = vi.fn()
  const onReconnect = vi.fn()
  const client = createRealtimeClient({
    url: location.origin,
    path: '/socket.io',
    loadIo: () => import('socket.io-client'),
    getToken: () => 'sess_1',
    onEvent,
    onReconnect,
  })
  const statuses: string[] = []
  client.subscribeStatus(() => statuses.push(client.getStatus()))
  const unsubscribe = client.subscribeNfts(['nft_a'])

  await client.connect()
  await until(() => client.getStatus() === 'connected')
  expect(subscriptions).toContainEqual({ nftIds: ['nft_a'] })

  for (const server of servers) {
    server.emit('nft.updated', event)
    server.emit('nft.updated', { lixo: true }) // fora do contrato: descartado
  }
  await until(() => onEvent.mock.calls.length > 0)
  expect(onEvent).toHaveBeenCalledExactlyOnceWith(event)

  for (const server of servers) server.close()
  await until(() => onReconnect.mock.calls.length > 0)
  expect(statuses).toContain('disconnected')

  unsubscribe()
  client.disconnect()
  expect(client.getStatus()).toBe('idle')
})

it('reconexão após troca de sessão abre nova conexão com o novo token (sem reaproveitar o Manager)', async () => {
  let token = 'sess_ana'
  const client = createRealtimeClient({
    url: location.origin,
    path: '/socket.io',
    loadIo: () => import('socket.io-client'),
    getToken: () => token,
    onEvent: () => undefined,
    onReconnect: () => undefined,
  })
  handshakeTokens.length = 0
  await client.connect()
  await until(() => client.getStatus() === 'connected')

  token = 'sess_bruno'
  await client.reconnect()
  await until(() => client.getStatus() === 'connected' && handshakeTokens.length >= 2)
  expect(handshakeTokens).toEqual(['sess_ana', 'sess_bruno'])
  client.disconnect()
})

it('volta a conectar logo depois que o servidor recusa tentativas (sem esperar 20 s)', async () => {
  const client = createRealtimeClient({
    url: location.origin,
    path: '/socket.io',
    loadIo: () => import('socket.io-client'),
    getToken: () => 'sess_1',
    onEvent: () => undefined,
    onReconnect: () => undefined,
  })
  await client.connect()
  await until(() => client.getStatus() === 'connected')

  refusing = true
  for (const server of servers) server.close()
  await until(() => client.getStatus() === 'disconnected')
  await new Promise((resolve) => setTimeout(resolve, 1000)) // ao menos uma tentativa recusada
  refusing = false
  // timeout de conexão (4 s) + backoff máximo (5 s × 1,5): bem abaixo dos 20 s do padrão do Socket.IO.
  await until(() => client.getStatus() === 'connected', 12_000)
  expect(client.getStatus()).toBe('connected')
  client.disconnect()
}, 20_000)
