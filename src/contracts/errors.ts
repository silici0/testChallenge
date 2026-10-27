import { z } from 'zod'

export const apiErrorCodeSchema = z.enum([
  'BAD_REQUEST',
  'UNAUTHENTICATED',
  'SESSION_EXPIRED',
  'INVALID_CREDENTIALS',
  'FORBIDDEN',
  'NOT_FOUND',
  'EMAIL_TAKEN',
  'USERNAME_TAKEN',
  'AVAILABILITY_CONFLICT',
  'QUOTE_STALE',
  'IDEMPOTENCY_CONFLICT',
  'WALLET_ROLE_TAKEN',
  'VALIDATION_ERROR',
  'COUPON_INVALID',
  'COUPON_EXPIRED',
  'WALLET_REJECTED',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
  'TRANSIENT_FAILURE',
])
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>

export const apiErrorBodySchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
    details: z.record(z.string(), z.unknown()).optional(),
    retryable: z.boolean(),
    requestId: z.string(),
  }),
})
export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>

/** Status HTTP de cada código (fonte única para o mock e para a documentação). */
export const apiErrorStatus: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHENTICATED: 401,
  SESSION_EXPIRED: 401,
  INVALID_CREDENTIALS: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  EMAIL_TAKEN: 409,
  USERNAME_TAKEN: 409,
  AVAILABILITY_CONFLICT: 409,
  QUOTE_STALE: 409,
  IDEMPOTENCY_CONFLICT: 409,
  WALLET_ROLE_TAKEN: 409,
  VALIDATION_ERROR: 422,
  COUPON_INVALID: 422,
  COUPON_EXPIRED: 422,
  WALLET_REJECTED: 422,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  TRANSIENT_FAILURE: 503,
}
