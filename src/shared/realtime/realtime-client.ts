import type * as SocketIoClient from 'socket.io-client'
import type { Socket } from 'socket.io-client'

import { REALTIME_EVENT_TYPES, type RealtimeEvent, realtimeEventSchema } from '@/contracts'

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected'

export interface RealtimeClientOptions {
  url: string
  path: string
  /** Import dinâmico do socket.io-client: só depois do MSW ativo (ADR-0024). */
  loadIo: () => Promise<typeof SocketIoClient>
  getToken: () => string | null
  onEvent: (event: RealtimeEvent) => void
  /** Reconexão após queda: o app reconcilia os recursos ativos com a API REST. */
  onReconnect: () => void
}

type Listener = () => void

/**
 * Cliente Socket.IO único do app. Eventos chegam sempre por aqui (nunca por chamadas diretas ao cache),
 * são validados pelo contrato e entregues ao roteador do app.
 */
export function createRealtimeClient(options: RealtimeClientOptions) {
  let socket: Socket | null = null
  let status: ConnectionStatus = 'idle'
  let hasConnectedBefore = false
  const subscribedNfts = new Set<string>()
  const listeners = new Set<Listener>()

  const setStatus = (next: ConnectionStatus) => {
    status = next
    for (const listener of listeners) listener()
  }

  const handleEvent = (payload: unknown) => {
    const parsed = realtimeEventSchema.safeParse(payload)
    if (parsed.success) options.onEvent(parsed.data)
    else if (import.meta.env.DEV) console.warn('[realtime] evento fora do contrato descartado', parsed.error.issues)
  }

  async function connect() {
    if (socket) return
    setStatus('connecting')
    const { io } = await options.loadIo()
    const token = options.getToken()
    const credentials = token ? { token } : {}
    const instance = io(options.url, {
      path: options.path,
      transports: ['websocket'],
      query: credentials,
      auth: credentials,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
    })
    socket = instance
    instance.on('connect', () => {
      setStatus('connected')
      if (subscribedNfts.size > 0) instance.emit('nft.subscribe', { nftIds: [...subscribedNfts] })
      if (hasConnectedBefore) options.onReconnect()
      hasConnectedBefore = true
    })
    instance.on('disconnect', () => {
      setStatus('disconnected')
    })
    instance.on('connect_error', () => {
      setStatus('disconnected')
    })
    for (const type of REALTIME_EVENT_TYPES) instance.on(type, handleEvent)
  }

  function disconnect() {
    socket?.removeAllListeners()
    socket?.disconnect()
    socket = null
    hasConnectedBefore = false
    setStatus('idle')
  }

  return {
    connect,
    disconnect,
    /** Troca de sessão: nova conexão com o novo token; nada da sessão anterior permanece. */
    reconnect: async () => {
      disconnect()
      await connect()
    },
    subscribeNfts: (nftIds: string[]) => {
      const added = nftIds.filter((id) => !subscribedNfts.has(id))
      for (const id of added) subscribedNfts.add(id)
      if (added.length > 0 && socket?.connected) socket.emit('nft.subscribe', { nftIds: added })
      return () => {
        for (const id of added) subscribedNfts.delete(id)
        if (added.length > 0 && socket?.connected) socket.emit('nft.unsubscribe', { nftIds: added })
      }
    },
    getStatus: () => status,
    subscribeStatus: (listener: Listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

export type RealtimeClient = ReturnType<typeof createRealtimeClient>
