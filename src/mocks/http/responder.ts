import { delay, http, HttpResponse, type HttpResponseResolver, type PathParams } from 'msw'
import { ZodError } from 'zod'

import { type ApiErrorCode, apiErrorStatus } from '@/contracts'

import type { UserRecord } from '../db/schema'
import type { MockDatabase } from '../db/store'
import { authenticate, expireSession } from '../domain/auth'
import { DomainError } from '../domain/context'
import type { Interception } from '../scenarios/definitions'
import type { ScenarioRuntime } from '../scenarios/runtime'

export interface MockServerConfig {
  apiBase: string
  requestTimeoutMs: number
}

/** Efeitos assíncronos da simulação (resolução de pedidos, socket), injetados para manter as rotas testáveis. */
export interface MockEffects {
  scheduleOrderResolution: (orderId: string) => void
  scheduleWalletDisconnect: (userId: string, walletId: string, afterMs: number) => void
  dropSockets: () => void
  restoreSockets: () => void
}

export interface MockServices {
  db: MockDatabase
  scenarios: ScenarioRuntime
  config: MockServerConfig
  effects: MockEffects
}

export interface RouteContext {
  request: Request
  params: PathParams
  services: MockServices
  token: string | null
  guestCartId: string | null
  /** Autentica (sliding) e devolve o usuário; lança UNAUTHENTICATED/SESSION_EXPIRED. */
  requireUser: () => Promise<UserRecord>
  json: <T>() => Promise<T>
}

export interface RouteResult {
  status?: number
  body?: unknown
}

/** Resultado `RouteResult` ({ status, body }) ou o corpo JSON diretamente. */
type Handler = (context: RouteContext) => Promise<unknown>
type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'
interface RouteOptions {
  /** Rota privada: participa das interceptações de sessão (session-expired, unauthorized). */
  private?: boolean
}

let requestCounter = 0
const requestId = () => `req_${(++requestCounter).toString().padStart(6, '0')}`

export function errorResponse(
  code: ApiErrorCode,
  message: string,
  extra: { fieldErrors?: Record<string, string[]>; details?: Record<string, unknown> } = {},
) {
  const status = apiErrorStatus[code]
  const id = requestId()
  return HttpResponse.json(
    { error: { code, message, retryable: status >= 500 || status === 429, requestId: id, ...extra } },
    { status, headers: { 'X-Request-Id': id } },
  )
}

const zodFieldErrors = (error: ZodError) =>
  error.issues.reduce<Record<string, string[]>>((fields, issue) => {
    const key = issue.path.join('.') || '_'
    fields[key] = [...(fields[key] ?? []), issue.message]
    return fields
  }, {})

function toErrorResponse(error: unknown) {
  if (error instanceof DomainError) return errorResponse(error.code, error.message, error.extra)
  if (error instanceof ZodError)
    return errorResponse('VALIDATION_ERROR', 'Dados inválidos', { fieldErrors: zodFieldErrors(error) })
  console.error('[mock] erro inesperado', error)
  return errorResponse('INTERNAL_ERROR', 'Erro inesperado no servidor simulado')
}

const isRouteResult = (value: unknown): value is RouteResult =>
  typeof value === 'object' &&
  value !== null &&
  ('status' in value || 'body' in value) &&
  Object.keys(value).every((key) => key === 'status' || key === 'body')

function toResponse(result: unknown) {
  const { status = 200, body } = isRouteResult(result) ? result : { body: result }
  const headers = { 'X-Request-Id': requestId() }
  return body === undefined
    ? new HttpResponse(null, { status, headers })
    : HttpResponse.json(body as never, { status, headers })
}

const bearer = (request: Request) => request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null

async function applyInterception(interception: Interception | null, services: MockServices, token: string | null) {
  if (!interception) return null
  if (interception.kind === 'network-error') return HttpResponse.error()
  if (interception.kind === 'expire-session') {
    if (token && services.scenarios.once(`expire:${token}`))
      await services.db.transaction(({ db }) => expireSession(db, token))
    return null
  }
  return errorResponse(
    interception.code,
    interception.message ?? interception.code,
    interception.fieldErrors ? { fieldErrors: interception.fieldErrors } : {},
  )
}

async function execute(handler: Handler, context: RouteContext): Promise<Response> {
  try {
    return toResponse(await handler(context))
  } catch (error) {
    return toErrorResponse(error)
  }
}

/** Cria rotas da API simulada com rede, cenário, autenticação e erros padronizados. */
export function createRoute(services: MockServices) {
  const build = ({
    method,
    path,
    handler,
    options,
  }: {
    method: HttpMethod
    path: string
    handler: Handler
    options: RouteOptions
  }) => {
    const resolver: HttpResponseResolver = async ({ request, params }) => {
      const { scenarios, config } = services
      const info = scenarios.describe(
        method.toUpperCase(),
        path.replace(/:(\w+)/g, (_, name: string) => String(params[name])),
        options.private ?? false,
      )
      if (scenarios.scenario.offline) return HttpResponse.error()
      await delay(scenarios.latency() + (scenarios.scenario.extraDelay?.(info, config.requestTimeoutMs) ?? 0))

      const token = bearer(request)
      const intercepted = await applyInterception(scenarios.scenario.intercept?.(info) ?? null, services, token)
      if (intercepted) return intercepted

      const context: RouteContext = {
        request,
        params,
        services,
        token,
        guestCartId: request.headers.get('x-guest-cart-id'),
        requireUser: () => services.db.transaction(({ db }) => authenticate(db, token).user),
        json: async <T>() => (await request.json().catch(() => ({}))) as T,
      }
      const response = await execute(handler, context)
      await delay(scenarios.scenario.responseDelay?.(info, config.requestTimeoutMs) ?? 0)
      return response
    }
    return http[method](`*${services.config.apiBase}${path}`, resolver)
  }
  return {
    route: (method: HttpMethod, path: string, handler: Handler) => build({ method, path, handler, options: {} }),
    privateRoute: (method: HttpMethod, path: string, handler: Handler) =>
      build({ method, path, handler, options: { private: true } }),
  }
}
