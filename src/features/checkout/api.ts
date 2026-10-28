import { queryOptions } from '@tanstack/react-query'

import { type CreateOrderBody, type Network, orderSchema, quoteSchema } from '@/contracts'
import { httpClient } from '@/shared/api'
import { queryKeys } from '@/shared/query'

export const quoteQuery = (userId: string, network: Network) =>
  queryOptions({
    queryKey: queryKeys.user.quote(userId, network),
    queryFn: ({ signal }) =>
      httpClient().request({ method: 'POST', url: '/quotes', data: { network }, schema: quoteSchema, signal }),
    staleTime: 0,
    gcTime: 30_000,
    refetchOnWindowFocus: true,
  })

export const checkoutApi = {
  /** A chave de idempotência é da tentativa (docs/checkout.md): retries reutilizam a mesma chave. */
  createOrder: (body: CreateOrderBody, idempotencyKey: string) =>
    httpClient().request({
      method: 'POST',
      url: '/orders',
      data: body,
      headers: { 'Idempotency-Key': idempotencyKey },
      schema: orderSchema,
    }),
}
