import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'

import { nftSubscriptionSchema, type RealtimeEvent } from '@/contracts'

import { isoNow } from '../db/runtime'
import type { MockDatabase } from '../db/store'
import type { ScenarioRuntime } from '../scenarios/runtime'

const HEARTBEAT_MS = 20_000
const STALE_REPLAY_MS = 500

interface Connection {
  userId: string | null
  nftIds: Set<string>
  emit: (event: RealtimeEvent) => void
  close: () => void
}

/** Origem ws(s) do Socket.IO: o MSW remove /socket.io/ do caminho antes do matching (ADR-0024). */
export const toSocketOrigin = (socketUrl: string) => new URL(socketUrl).origin.replace(/^http/, 'ws')

function sessionUser(db: MockDatabase, token: string | null): string | null {
  if (!token) return null
  return db.read(
    (state) =>
      state.sessions.find((session) => session.token === token && session.expiresAt > isoNow())?.userId ?? null,
  )
}

/**
 * Servidor Socket.IO simulado. Eventos públicos (nft.updated) vão para todas as conexões; eventos
 * privados só para conexões autenticadas do mesmo usuário (isolamento entre sessões).
 */
export function createRealtimeServer({
  db,
  scenarios,
  socketUrl,
}: {
  db: MockDatabase
  scenarios: ScenarioRuntime
  socketUrl: string
}) {
  const connections = new Set<Connection>()
  const lastByResource = new Map<string, RealtimeEvent>()
  let blocked = false

  const deliver = (event: RealtimeEvent) => {
    const recipients = [...connections].filter(
      (connection) => event.userId === null || event.userId === connection.userId,
    )
    const previous = lastByResource.get(`${event.resource.type}:${event.resource.id}`)
    lastByResource.set(`${event.resource.type}:${event.resource.id}`, event)
    for (const connection of recipients) {
      connection.emit(event)
      if (!scenarios.scenario.duplicateEvents) continue
      connection.emit(event) // duplicata exata (mesmo eventId)
      const stale = previous ?? { ...event, eventId: `${event.eventId}-stale`, version: Math.max(1, event.version - 1) }
      setTimeout(() => {
        connection.emit(stale)
      }, STALE_REPLAY_MS)
    }
  }
  db.subscribe(deliver)

  const handler = ws.link(toSocketOrigin(socketUrl)).addEventListener('connection', (connection) => {
    if (blocked || scenarios.scenario.offline) {
      connection.client.close()
      return
    }
    const io = toSocketIo(connection)
    const state: Connection = {
      userId: sessionUser(db, connection.client.url.searchParams.get('token')),
      nftIds: new Set(),
      emit: (event) => {
        io.client.emit(event.type, event)
      },
      close: () => {
        connection.client.close()
      },
    }
    connections.add(state)
    // O binding não envia ping do Engine.IO; sem ele o cliente desconecta por pingTimeout.
    const heartbeat = setInterval(() => {
      connection.client.send('2')
    }, HEARTBEAT_MS)
    connection.client.addEventListener('close', () => {
      clearInterval(heartbeat)
      connections.delete(state)
    })
    io.client.on('nft.subscribe', (_event, payload: unknown) => {
      for (const id of nftSubscriptionSchema.parse(payload).nftIds) state.nftIds.add(id)
    })
    io.client.on('nft.unsubscribe', (_event, payload: unknown) => {
      for (const id of nftSubscriptionSchema.parse(payload).nftIds) state.nftIds.delete(id)
    })
  })

  return {
    handler,
    /** Reenvia o último evento de um recurso (duplicata controlada pelos testes). */
    replay: (resourceKey: string) => {
      const event = lastByResource.get(resourceKey)
      if (event) for (const connection of connections) connection.emit(event)
      return Boolean(event)
    },
    drop: () => {
      blocked = true
      for (const connection of connections) connection.close()
    },
    restore: () => {
      blocked = false
    },
    get size() {
      return connections.size
    },
  }
}

export type RealtimeServer = ReturnType<typeof createRealtimeServer>
