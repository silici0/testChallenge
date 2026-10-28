import { describe, expect, it } from 'vitest'

import { ApiError } from '@/shared/api'

import { retryDelay, shouldRetryQuery } from './query-client'

const error = (code: ConstructorParameters<typeof ApiError>[0]['code'], retryable: boolean) =>
  new ApiError({ code, message: code, retryable })

describe('política de retry das queries', () => {
  it('repete até 2 vezes apenas erros retryable (rede, timeout, 5xx)', () => {
    expect(shouldRetryQuery(0, error('NETWORK_ERROR', true))).toBe(true)
    expect(shouldRetryQuery(1, error('TRANSIENT_FAILURE', true))).toBe(true)
    expect(shouldRetryQuery(2, error('TRANSIENT_FAILURE', true))).toBe(false)
  })

  it('nunca repete 4xx, cancelamento ou erro de contrato', () => {
    expect(shouldRetryQuery(0, error('NOT_FOUND', false))).toBe(false)
    expect(shouldRetryQuery(0, error('CONTRACT_ERROR', false))).toBe(false)
    expect(shouldRetryQuery(0, new Error('qualquer'))).toBe(false)
  })

  it('backoff exponencial com teto', () => {
    expect(retryDelay(0)).toBeGreaterThanOrEqual(500)
    expect(retryDelay(1)).toBeGreaterThanOrEqual(1000)
    expect(retryDelay(10)).toBeLessThanOrEqual(8000 + 250)
  })
})
