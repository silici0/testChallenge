import type { ApiErrorCode } from '@/contracts'

import type { DomainContext } from '../domain/context'
import type { OrderResolutionPlan } from '../domain/orders'

export const SCENARIO_IDS = [
  'default',
  'empty-catalog',
  'slow-network',
  'variable-latency',
  'out-of-order',
  'offline',
  'server-error',
  'http-errors',
  'session-expired',
  'unauthorized',
  'register-conflict',
  'form-validation',
  'favorite-failure',
  'price-change-checkout',
  'sold-out-checkout',
  'order-timeout',
  'payment-confirmed',
  'payment-declined',
  'socket-drop-pending',
  'duplicate-events',
  'wallet-rejected',
  'wallet-disconnect',
] as const
export type ScenarioId = (typeof SCENARIO_IDS)[number]

export const isScenarioId = (value: unknown): value is ScenarioId => SCENARIO_IDS.includes(value as ScenarioId)

export interface RequestInfo {
  method: string
  /** Caminho relativo à API, ex.: `/nfts`, `/cart/items/item_1`. */
  path: string
  /** Índice da requisição para o mesmo método+caminho no cenário atual (0, 1, 2…). */
  attempt: number
  /** Índice global das requisições `GET /nfts` (respostas fora de ordem). */
  listSequence: number
  isPrivate: boolean
}

export type Interception =
  | { kind: 'error'; code: ApiErrorCode; message?: string; fieldErrors?: Record<string, string[]> }
  | { kind: 'network-error' }
  | { kind: 'expire-session' }

export interface Scenario {
  id: ScenarioId
  description: string
  /** Latência em ms (fixa ou intervalo determinístico). */
  latency: number | [number, number]
  offline?: boolean
  /** Atraso extra por requisição (fora de ordem, timeout). */
  extraDelay?: (request: RequestInfo, timeoutMs: number) => number
  /** Substitui a resposta (erros, sessão expirada). Avaliado antes do handler. */
  intercept?: (request: RequestInfo) => Interception | null
  /** Mudança no catálogo logo após a 1ª cotação (preço alterado / edição esgotada no checkout). */
  afterFirstQuote?: (context: DomainContext, userId: string) => void
  orderPlan: OrderResolutionPlan
  socketDropAfterOrder?: { dropAfterMs: number; confirmAfterMs: number; restoreAfterMs: number }
  duplicateEvents?: boolean
  emptyCatalog?: boolean
  rejectWalletConnection?: boolean
  disconnectWalletAfterMs?: number
}
