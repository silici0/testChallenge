import { QueryClient } from '@tanstack/react-query'

import { isApiError } from '@/shared/api'

const MAX_QUERY_RETRIES = 2

/** Retries só para falhas transitórias (docs/cache-strategy.md). 4xx e erros de contrato nunca. */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  return isApiError(error) && error.retryable && failureCount < MAX_QUERY_RETRIES
}

/** 500 ms, 1 s, 2 s… até 8 s, com jitter para não sincronizar clientes. */
export function retryDelay(attempt: number): number {
  return Math.min(500 * 2 ** attempt, 8000) + Math.floor(Math.random() * 250)
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: shouldRetryQuery,
        retryDelay,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: { retry: 0 },
    },
  })
}
