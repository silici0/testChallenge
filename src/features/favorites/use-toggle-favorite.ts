import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { FavoritesResponse } from '@/contracts'
import type { Announce } from '@/shared/a11y'
import { queryKeys } from '@/shared/query'

import { favoritesApi } from './api'

interface ToggleVariables {
  nftId: string
  favorite: boolean
}

const applyToggle = (data: FavoritesResponse | undefined, { nftId, favorite }: ToggleVariables): FavoritesResponse => {
  const ids = new Set(data?.nftIds ?? [])
  if (favorite) ids.add(nftId)
  else ids.delete(nftId)
  return { nftIds: [...ids], items: (data?.items ?? []).filter((item) => favorite || item.id !== nftId) }
}

/**
 * Atualização otimista com rollback (enunciado §4): o cache muda na hora; se a API falhar, o estado
 * anterior é restaurado e o erro é anunciado. Ao final, a lista é revalidada com o servidor.
 */
export function useToggleFavorite({ userId, nftId, announce }: { userId: string; nftId: string; announce: Announce }) {
  const queryClient = useQueryClient()
  const key = queryKeys.user.favorites(userId)

  const mutation = useMutation({
    // Cliques repetidos no mesmo NFT são serializados: o estado final segue a ordem dos cliques.
    scope: { id: `favorite:${nftId}` },
    mutationFn: ({ nftId, favorite }: ToggleVariables) => favoritesApi.set(nftId, favorite),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<FavoritesResponse>(key)
      queryClient.setQueryData<FavoritesResponse>(key, (data) => applyToggle(data, variables))
      return { previous }
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(key, context?.previous)
      announce('Não foi possível atualizar o favorito. Tente novamente.', 'assertive')
    },
    onSuccess: (_data, { favorite }) => {
      announce(favorite ? 'Adicionado aos favoritos.' : 'Removido dos favoritos.', 'polite')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })

  return {
    toggle: (favorite: boolean) => {
      mutation.mutate({ nftId, favorite })
    },
    isPending: mutation.isPending,
  }
}
