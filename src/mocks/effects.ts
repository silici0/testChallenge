import type { MockDatabase } from './db/store'
import { setWalletConnection } from './domain/account'
import { dueResolutions, resolveOrder } from './domain/orders'
import type { MockEffects } from './http/responder'
import type { ScenarioRuntime } from './scenarios/runtime'
import type { RealtimeServer } from './socket/server'

/** Efeitos temporais da simulação. Usam timers da página, controláveis por `page.clock` nos testes. */
export function createEffects({
  db,
  scenarios,
  realtime,
}: {
  db: MockDatabase
  scenarios: ScenarioRuntime
  realtime: RealtimeServer
}): MockEffects & { resumePending: () => void } {
  const resolve = (orderId: string) =>
    db.transaction((context) => {
      const order = context.db.orders.find((candidate) => candidate.id === orderId)
      if (order?.resolution)
        resolveOrder(context, { orderId, status: order.resolution.status, reason: order.resolution.reason })
    })

  const scheduleOrderResolution = (orderId: string) => {
    const at = db.read((state) => state.orders.find((order) => order.id === orderId)?.resolution?.at)
    if (!at) return
    setTimeout(() => void resolve(orderId), Math.max(0, Date.parse(at) - Date.now()))
    const drop = scenarios.scenario.socketDropAfterOrder
    if (drop) {
      setTimeout(realtime.drop, drop.dropAfterMs)
      setTimeout(realtime.restore, drop.restoreAfterMs)
    }
  }

  return {
    scheduleOrderResolution,
    scheduleWalletDisconnect: (userId, walletId, afterMs) => {
      setTimeout(() => {
        void db.transaction((context) => {
          const wallet = setWalletConnection(context.db, userId, { walletId, connection: 'disconnected' })
          context.emit({
            type: 'wallet.updated',
            resource: { type: 'wallet', id: wallet.id },
            version: wallet.version,
            userId,
            data: { connection: 'disconnected' },
          })
        })
      }, afterMs)
    },
    dropSockets: realtime.drop,
    restoreSockets: realtime.restore,
    /** Após refresh: resolve pedidos vencidos e reagenda os futuros (recuperação de pedido pendente). */
    resumePending: () => {
      const now = new Date().toISOString()
      for (const order of db.read((state) => dueResolutions(state, now))) void resolve(order.id)
      const future = db.read((state) =>
        state.orders.filter((order) => order.status === 'pending' && order.resolution && order.resolution.at > now),
      )
      for (const order of future) scheduleOrderResolution(order.id)
    },
  }
}
