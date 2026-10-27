import { AxiosError, isCancel } from 'axios'
import { ZodError } from 'zod'

import { apiErrorBodySchema, type ApiErrorCode } from '@/contracts/errors'

/** Códigos gerados no cliente, além dos códigos da API. */
export type ClientErrorCode = 'NETWORK_ERROR' | 'TIMEOUT' | 'CANCELED' | 'CONTRACT_ERROR'
export type ErrorCode = ApiErrorCode | ClientErrorCode

interface ApiErrorInit {
  code: ErrorCode
  message: string
  status?: number | undefined
  retryable: boolean
  fieldErrors?: Record<string, string[]> | undefined
  details?: Record<string, unknown> | undefined
  requestId?: string | undefined
  cause?: unknown
}

/** Único tipo de erro visto por Query e UI (ADR-0009). */
export class ApiError extends Error {
  readonly code: ErrorCode
  readonly status: number | undefined
  readonly retryable: boolean
  readonly fieldErrors: Record<string, string[]>
  readonly details: Record<string, unknown>
  readonly requestId: string | undefined

  constructor(init: ApiErrorInit) {
    super(init.message, { cause: init.cause })
    this.name = 'ApiError'
    this.code = init.code
    this.status = init.status
    this.retryable = init.retryable
    this.fieldErrors = init.fieldErrors ?? {}
    this.details = init.details ?? {}
    this.requestId = init.requestId
  }

  is(...codes: ErrorCode[]): boolean {
    return codes.includes(this.code)
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError

const TIMEOUT_CODES = new Set(['ECONNABORTED', 'ETIMEDOUT'])

function fromAxiosResponse(error: AxiosError): ApiError {
  const status = error.response?.status ?? 0
  const parsed = apiErrorBodySchema.safeParse(error.response?.data)
  if (parsed.success) {
    const body = parsed.data.error
    return new ApiError({ ...body, status, retryable: body.retryable || status >= 500, cause: error })
  }
  const isServerError = status >= 500
  return new ApiError({
    code: isServerError ? 'INTERNAL_ERROR' : 'BAD_REQUEST',
    message: `HTTP ${status}`,
    status,
    retryable: isServerError,
    cause: error,
  })
}

export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error
  if (isCancel(error))
    return new ApiError({ code: 'CANCELED', message: 'Requisição cancelada', retryable: false, cause: error })
  if (error instanceof ZodError) {
    return new ApiError({
      code: 'CONTRACT_ERROR',
      message: 'Resposta fora do contrato',
      retryable: false,
      cause: error,
    })
  }
  if (error instanceof AxiosError) {
    if (error.response) return fromAxiosResponse(error)
    if (TIMEOUT_CODES.has(error.code ?? '')) {
      return new ApiError({ code: 'TIMEOUT', message: 'Tempo de resposta esgotado', retryable: true, cause: error })
    }
    return new ApiError({ code: 'NETWORK_ERROR', message: 'Falha de conexão', retryable: true, cause: error })
  }
  return new ApiError({ code: 'INTERNAL_ERROR', message: 'Erro inesperado', retryable: false, cause: error })
}
