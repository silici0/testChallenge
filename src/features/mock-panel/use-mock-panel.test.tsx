import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { mockPanelApi } from './api'
import { useMockPanel } from './use-mock-panel'

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const navigate = vi.fn()
  const { result } = renderHook(() => useMockPanel({ navigate }), { wrapper })
  return { result, invalidate, navigate }
}

describe('useMockPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('lista os cenários do servidor simulado', async () => {
    vi.spyOn(mockPanelApi, 'scenarios').mockResolvedValue({
      active: 'slow-network',
      items: [{ id: 'slow-network', description: 'Lenta' }],
    })
    const { result } = setup()
    await waitFor(() => expect(result.current.active).toBe('slow-network'))
    expect(result.current.scenarios).toEqual([{ id: 'slow-network', description: 'Lenta' }])
  })

  it('ativar um cenário refaz as consultas para refleti-lo', async () => {
    vi.spyOn(mockPanelApi, 'scenarios').mockResolvedValue({ active: 'default', items: [] })
    const activate = vi.spyOn(mockPanelApi, 'activate').mockResolvedValue()
    const { result, invalidate } = setup()
    act(() => result.current.activate('http-errors'))
    await waitFor(() => expect(invalidate).toHaveBeenCalled())
    expect(activate.mock.calls[0]?.[0]).toBe('http-errors')
  })

  it('socket e reset usam o plano de controle', async () => {
    vi.spyOn(mockPanelApi, 'scenarios').mockResolvedValue({ active: 'default', items: [] })
    const socket = vi.spyOn(mockPanelApi, 'setSocket').mockResolvedValue()
    const { result, navigate } = setup()
    act(() => result.current.dropSocket())
    await waitFor(() => expect(socket.mock.calls[0]?.[0]).toBe('drop'))
    act(() => result.current.restoreSocket())
    await waitFor(() => expect(socket.mock.calls[1]?.[0]).toBe('restore'))
    result.current.reset()
    expect(navigate).toHaveBeenCalledWith('/?reset=1')
  })
})
