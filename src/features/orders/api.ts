import { queryOptions } from '@tanstack/react-query'

import { orderSchema, ordersResponseSchema } from '@/contracts'
import { httpClient } from '@/shared/api'
import { queryKeys } from '@/shared/query'

export const orderQuery = (userId: string, orderId: string) =>
  queryOptions({
    queryKey: queryKeys.user.order(userId, orderId),
    queryFn: ({ signal }) =>
      httpClient().request({
        method: 'GET',
        url: `/orders/${encodeURIComponent(orderId)}`,
        schema: orderSchema,
        signal,
      }),
    staleTime: 0,
  })

export const pendingOrdersQuery = (userId: string) =>
  queryOptions({
    queryKey: queryKeys.user.pendingOrders(userId),
    queryFn: ({ signal }) =>
      httpClient().request({
        method: 'GET',
        url: '/orders',
        params: { status: 'pending' },
        schema: ordersResponseSchema,
        signal,
      }),
    staleTime: 0,
  })
