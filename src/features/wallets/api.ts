import { queryOptions } from '@tanstack/react-query'

import { type Network, type WalletInput, walletSchema, walletsResponseSchema } from '@/contracts'
import { httpClient } from '@/shared/api'
import { queryKeys } from '@/shared/query'

export const walletsQuery = (userId: string) =>
  queryOptions({
    queryKey: queryKeys.user.wallets(userId),
    queryFn: ({ signal }) =>
      httpClient().request({ method: 'GET', url: '/me/wallets', schema: walletsResponseSchema, signal }),
    staleTime: 60_000,
  })

export const walletsApi = {
  create: (input: WalletInput) =>
    httpClient().request({ method: 'POST', url: '/me/wallets', data: input, schema: walletSchema }),
  update: (walletId: string, input: WalletInput) =>
    httpClient().request({ method: 'PATCH', url: `/me/wallets/${walletId}`, data: input, schema: walletSchema }),
  connect: (walletId: string, network: Network) =>
    httpClient().request({
      method: 'POST',
      url: `/me/wallets/${walletId}/connect`,
      data: { network },
      schema: walletSchema,
    }),
  disconnect: (walletId: string) =>
    httpClient().request({ method: 'POST', url: `/me/wallets/${walletId}/disconnect`, schema: walletSchema }),
}
