import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { favoritesResponseSchema } from '@/contracts'
import { httpClient } from '@/shared/api'
import { queryKeys } from '@/shared/query'

export const favoritesQuery = (userId: string) =>
  queryOptions({
    queryKey: queryKeys.user.favorites(userId),
    queryFn: ({ signal }) =>
      httpClient().request({ method: 'GET', url: '/me/favorites', schema: favoritesResponseSchema, signal }),
    staleTime: 60_000,
  })

export const favoritesApi = {
  set: (nftId: string, favorite: boolean) =>
    httpClient().request({
      method: favorite ? 'PUT' : 'DELETE',
      url: `/me/favorites/${encodeURIComponent(nftId)}`,
      schema: z.unknown(),
    }),
}
