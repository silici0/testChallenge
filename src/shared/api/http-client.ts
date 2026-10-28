import axios, { type AxiosInstance, type Method } from 'axios'
import type { z } from 'zod'

import { toApiError } from './api-error'

export interface AuthState {
  token?: string | null | undefined
  guestCartId?: string | null | undefined
}

export interface HttpClientOptions {
  baseURL: string
  timeoutMs: number
  /** Lido a cada requisição: o cliente não guarda estado de sessão. */
  getAuth: () => AuthState
  /** Chamado uma única vez por token quando a API responde SESSION_EXPIRED. */
  onSessionExpired: () => void
}

export interface RequestConfig<TSchema extends z.ZodType> {
  method: Method
  url: string
  schema: TSchema
  data?: unknown
  params?: Record<string, unknown>
  headers?: Record<string, string>
  signal?: AbortSignal | undefined
}

export interface HttpClient {
  request<TSchema extends z.ZodType>(config: RequestConfig<TSchema>): Promise<z.infer<TSchema>>
  /** Instância Axios (para casos raros, como upload com progresso). */
  readonly axios: AxiosInstance
}

/** Query string com arrays repetidos (`category=a&category=b`) e sem valores vazios. */
export function serializeParams(params: Record<string, unknown>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    const values = Array.isArray(value) ? value : [value]
    for (const item of values) {
      if (item === undefined || item === null || item === '') continue
      search.append(key, String(item as string | number | boolean))
    }
  }
  return search.toString()
}

let requestCounter = 0
const nextRequestId = () => `web_${Date.now().toString(36)}_${(requestCounter++).toString(36)}`

export function createHttpClient({ baseURL, timeoutMs, getAuth, onSessionExpired }: HttpClientOptions): HttpClient {
  const instance = axios.create({ baseURL, timeout: timeoutMs, paramsSerializer: { serialize: serializeParams } })
  const expiredTokens = new Set<string>()

  instance.interceptors.request.use((config) => {
    const { token, guestCartId } = getAuth()
    if (token) config.headers.set('Authorization', `Bearer ${token}`)
    else if (guestCartId) config.headers.set('X-Guest-Cart-Id', guestCartId)
    config.headers.set('X-Request-Id', nextRequestId())
    return config
  })

  instance.interceptors.response.use(undefined, (error: unknown) => {
    const apiError = toApiError(error)
    const { token } = getAuth()
    if (apiError.code === 'SESSION_EXPIRED' && token && !expiredTokens.has(token)) {
      expiredTokens.add(token)
      onSessionExpired()
    }
    return Promise.reject(apiError)
  })

  return {
    axios: instance,
    async request({ method, url, schema, data, params, headers, signal }) {
      try {
        const response = await instance.request<unknown>({
          method,
          url,
          data,
          params,
          headers: headers ?? {},
          ...(signal ? { signal } : {}),
        })
        return schema.parse(response.data)
      } catch (error) {
        throw toApiError(error)
      }
    },
  }
}
