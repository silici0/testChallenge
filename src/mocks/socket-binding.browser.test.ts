import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import { setupWorker } from 'msw/browser'
import { afterAll, beforeAll, expect, it } from 'vitest'

// O MSW remove o prefixo /socket.io/ do caminho antes do matching: o link casa com a origem.
const realtime = ws.link(`ws://${location.host}`)
let connectedUrl = ''

const worker = setupWorker(
  realtime.addEventListener('connection', (connection) => {
    connectedUrl = connection.client.url.href
    const socket = toSocketIo(connection)
    socket.client.on('nft.subscribe', (_event, payload: unknown) => {
      socket.client.emit('nft.updated', { echo: payload })
    })
  }),
)

beforeAll(async () => {
  await worker.start({ quiet: true, onUnhandledRequest: 'bypass' })
})
afterAll(() => {
  worker.stop()
})

it('contrato do binding: socket.io-client conecta, envia e recebe eventos pelo binding, com token na query', async () => {
  // engine.io-client guarda a referência a WebSocket ao ser importado: importar só depois do MSW ativo.
  const { io } = await import('socket.io-client')
  const client = io(location.origin, { transports: ['websocket'], query: { token: 'sess_123' } })
  const received = await new Promise((resolve) => {
    client.on('nft.updated', resolve)
    client.on('connect', () => {
      client.emit('nft.subscribe', { nftIds: ['a'] })
    })
  })
  client.close()
  expect(received).toEqual({ echo: { nftIds: ['a'] } })
  expect(new URL(connectedUrl).searchParams.get('token')).toBe('sess_123')
})
