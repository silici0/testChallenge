import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useQuantityStepper } from './use-quantity-stepper'

describe('useQuantityStepper', () => {
  it('incrementa e decrementa dentro dos limites', () => {
    const { result } = renderHook(() => useQuantityStepper({ defaultValue: 1, min: 1, max: 3 }))

    act(() => result.current.increment())
    act(() => result.current.increment())
    act(() => result.current.increment())
    expect(result.current.value).toBe(3)
    expect(result.current.canIncrement).toBe(false)

    act(() => result.current.decrement())
    expect(result.current.value).toBe(2)
  })

  it('desabilita o decremento no mínimo (comentário #10 do Figma)', () => {
    const { result } = renderHook(() => useQuantityStepper({ defaultValue: 1, min: 1, max: 5 }))
    expect(result.current.canDecrement).toBe(false)
  })

  it('normaliza entrada digitada: inteiro e dentro dos limites', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useQuantityStepper({ defaultValue: 2, min: 1, max: 10, onChange }))

    act(() => result.current.setFromInput('7.8'))
    expect(result.current.value).toBe(7)

    act(() => result.current.setFromInput('99'))
    expect(result.current.value).toBe(10)

    act(() => result.current.setFromInput('abc'))
    expect(result.current.value).toBe(10)
    expect(onChange).toHaveBeenLastCalledWith(10)
  })

  it('trata max menor que min como indisponível', () => {
    const { result } = renderHook(() => useQuantityStepper({ defaultValue: 1, min: 1, max: 0 }))
    expect(result.current.isUnavailable).toBe(true)
    expect(result.current.canIncrement).toBe(false)
    expect(result.current.canDecrement).toBe(false)
  })
})
