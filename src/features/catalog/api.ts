import { keepPreviousData, queryOptions } from '@tanstack/react-query'

import { facetsResponseSchema, featuredResponseSchema, type NftListParams, nftListResponseSchema } from '@/contracts'
import { ApiError, httpClient } from '@/shared/api'
import { normalizeListParams, queryKeys } from '@/shared/query'

const toQuery = (params: NftListParams) => normalizeListParams(params) as Record<string, unknown>

/** Defesa adicional contra respostas fora de ordem: a resposta precisa ecoar os parâmetros pedidos. */
function assertMatchesRequest(requested: NftListParams, applied: NftListParams) {
  if (JSON.stringify(normalizeListParams(requested)) !== JSON.stringify(normalizeListParams(applied))) {
    throw new ApiError({
      code: 'CONTRACT_ERROR',
      message: 'Resposta não corresponde aos filtros pedidos',
      retryable: false,
    })
  }
}

export const nftListQuery = (params: NftListParams) =>
  queryOptions({
    queryKey: queryKeys.nfts.list(params),
    queryFn: async ({ signal }) => {
      const response = await httpClient().request({
        method: 'GET',
        url: '/nfts',
        params: toQuery(params),
        schema: nftListResponseSchema,
        signal,
      })
      assertMatchesRequest(params, response.appliedFilters)
      return response
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })

export const facetsQuery = (params: NftListParams) =>
  queryOptions({
    queryKey: queryKeys.nfts.facets(params),
    queryFn: ({ signal }) =>
      httpClient().request({
        method: 'GET',
        url: '/nfts/facets',
        params: toQuery({ ...params, page: 1 }),
        schema: facetsResponseSchema,
        signal,
      }),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  })

export const featuredQuery = () =>
  queryOptions({
    queryKey: queryKeys.nfts.featured(),
    queryFn: ({ signal }) =>
      httpClient().request({ method: 'GET', url: '/nfts/featured', schema: featuredResponseSchema, signal }),
    staleTime: 60_000,
  })
