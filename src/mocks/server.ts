import { controlRoutes } from './control/routes'
import { createSeedState } from './db/seed'
import { type KeyValueStorage, MockDatabase } from './db/store'
import { createEffects } from './effects'
import type { MockServerConfig, MockServices } from './http/responder'
import { accountRoutes } from './http/rest/account'
import { authRoutes } from './http/rest/auth'
import { cartRoutes } from './http/rest/cart'
import { catalogRoutes } from './http/rest/catalog'
import { orderRoutes } from './http/rest/orders'
import type { ScenarioId } from './scenarios/definitions'
import { ScenarioRuntime } from './scenarios/runtime'
import { createRealtimeServer } from './socket/server'

export interface MockServerOptions extends MockServerConfig {
  socketUrl: string
  storage: KeyValueStorage | null
  defaultScenario: ScenarioId
}

/** Monta o servidor simulado completo (REST + Socket.IO + controle), independente de browser/node. */
export async function createMockServer(options: MockServerOptions) {
  const db = await MockDatabase.open({ storage: options.storage, createSeed: createSeedState })
  const scenarios = new ScenarioRuntime(options.storage, options.defaultScenario)
  const realtime = createRealtimeServer({ db, scenarios, socketUrl: options.socketUrl })
  const effects = createEffects({ db, scenarios, realtime })
  const services: MockServices = {
    db,
    scenarios,
    effects,
    config: { apiBase: options.apiBase, requestTimeoutMs: options.requestTimeoutMs },
  }
  const handlers = [
    ...controlRoutes(services, realtime),
    ...authRoutes(services),
    ...catalogRoutes(services),
    ...cartRoutes(services),
    ...orderRoutes(services),
    ...accountRoutes(services),
    realtime.handler,
  ]
  return { db, scenarios, realtime, effects, handlers }
}

export type MockServer = Awaited<ReturnType<typeof createMockServer>>
