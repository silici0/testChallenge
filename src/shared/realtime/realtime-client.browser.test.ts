import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import { setupWorker } from 'msw/browser'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'

import type { RealtimeEvent } from '@/contracts'

import { createRealtimeClient } from './realtime-client'

const origin = `ws://${location.host}`
const subscriptions: unknown[] = []
const servers = new Set<{ emit: (type: string, payload: unknown) => void; close: () => void }>()

const worker = setupWorker(
  ws.link(origin).addEventListener('connection', (connection) => {
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

const until = async (check: () => boolean) => {
  const start = Date.now()
  while (!check()) {
    if (Date.now() - start > 4000) throw new Error('timeout')
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
