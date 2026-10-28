import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useLineQuantity } from './use-line-quantity'

describe('useLineQuantity (debounce de 400 ms)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('mostra a quantidade imediatamente e envia só a última após 400 ms', () => {
    const commit = vi.fn()
    const { result } = renderHook(() => useLineQuantity({ serverQuantity: 1, commit }))
    act(() => result.current.setQuantity(2))
    act(() => result.current.setQuantity(3))
    expect(result.current.quantity).toBe(3)
    expect(commit).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(commit).toHaveBeenCalledExactlyOnceWith(3)
  })

  it('não envia nada se voltar ao valor do servidor', () => {
    const commit = vi.fn()
    const { result } = renderHook(() => useLineQuantity({ serverQuantity: 2, commit }))
    act(() => result.current.setQuantity(3))
    act(() => result.current.setQuantity(2))
    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(commit).not.toHaveBeenCalled()
  })

  it('acompanha a quantidade do servidor (ex.: ajuste por disponibilidade)', () => {
    const { result, rerender } = renderHook(
      ({ server }) => useLineQuantity({ serverQuantity: server, commit: vi.fn() }),
      { initialProps: { server: 5 } },
    )
    rerender({ server: 2 })
    expect(result.current.quantity).toBe(2)
  })
})
