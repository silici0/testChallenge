import { queryOptions } from '@tanstack/react-query'

import { nftDetailSchema } from '@/contracts'
import { httpClient } from '@/shared/api'
import { queryKeys } from '@/shared/query'

export const nftDetailQuery = (nftId: string) =>
  queryOptions({
    queryKey: queryKeys.nfts.detail(nftId),
    queryFn: ({ signal }) =>
      httpClient().request({
        method: 'GET',
        url: `/nfts/${encodeURIComponent(nftId)}`,
        schema: nftDetailSchema,
        signal,
      }),
    staleTime: 15_000,
  })
