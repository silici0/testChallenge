import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useControllableState } from './use-controllable-state'

describe('useControllableState', () => {
  it('funciona como estado interno quando não controlado', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useControllableState({ defaultValue: 1, onChange }))

    act(() => result.current[1](2))

    expect(result.current[0]).toBe(2)
    expect(onChange).toHaveBeenCalledWith(2)
  })

  it('respeita o valor controlado e apenas notifica mudanças', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useControllableState({ value: 5, defaultValue: 1, onChange }))

    act(() => result.current[1](6))

    expect(result.current[0]).toBe(5)
    expect(onChange).toHaveBeenCalledWith(6)
  })

  it('não notifica quando o valor não muda', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useControllableState({ defaultValue: 1, onChange }))

    act(() => result.current[1](1))

    expect(onChange).not.toHaveBeenCalled()
  })
})
