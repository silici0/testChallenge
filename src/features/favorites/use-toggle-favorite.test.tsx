import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/shared/api'
import { queryKeys } from '@/shared/query'

import { favoritesApi } from './api'
import { useToggleFavorite } from './use-toggle-favorite'

const USER = 'usr_ana'

function setup(nftId: string, initial: string[] = []) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })
  queryClient.setQueryData(queryKeys.user.favorites(USER), { nftIds: initial, items: [] })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const announce = vi.fn()
  const { result } = renderHook(() => useToggleFavorite({ userId: USER, nftId, announce }), { wrapper })
  const favorites = () => queryClient.getQueryData<{ nftIds: string[] }>(queryKeys.user.favorites(USER))?.nftIds
  return { result, favorites, announce }
}

describe('useToggleFavorite (atualização otimista)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('atualiza o cache imediatamente, antes da resposta da API', async () => {
    let resolve: () => void = () => undefined
    vi.spyOn(favoritesApi, 'set').mockReturnValue(new Promise((done) => (resolve = () => done(undefined))))
    const { result, favorites } = setup('nft_a')

    act(() => result.current.toggle(true))
    await waitFor(() => expect(favorites()).toEqual(['nft_a']))
    act(() => resolve())
  })

  it('desfaz e anuncia o erro quando a API falha (rollback)', async () => {
    vi.spyOn(favoritesApi, 'set').mockRejectedValue(
      new ApiError({ code: 'INTERNAL_ERROR', message: 'x', retryable: true }),
    )
    const { result, favorites, announce } = setup('nft_b', ['nft_b'])

    act(() => result.current.toggle(false))
    await waitFor(() => expect(announce).toHaveBeenCalledWith(expect.stringMatching(/não foi possível/i), 'assertive'))
    expect(favorites()).toEqual(['nft_b'])
  })

  it('anuncia o sucesso', async () => {
    vi.spyOn(favoritesApi, 'set').mockResolvedValue(undefined)
    const { result, announce } = setup('nft_c')
    act(() => result.current.toggle(true))
    await waitFor(() => expect(announce).toHaveBeenCalledWith('Adicionado aos favoritos.', 'polite'))
  })
})
