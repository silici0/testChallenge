import { useCallback } from 'react'

import { useControllableState } from '../use-controllable-state/use-controllable-state'

export interface UseQuantityStepperParams {
  value?: number | undefined
  defaultValue?: number
  min?: number
  /** Limite superior: `min(disponível, maxPerOrder)`. Menor que `min` = indisponível. */
  max: number
  onChange?: ((value: number) => void) | undefined
}

export interface QuantityStepperState {
  value: number
  min: number
  max: number
  canIncrement: boolean
  canDecrement: boolean
  isUnavailable: boolean
  increment: () => void
  decrement: () => void
  setFromInput: (raw: string) => void
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

/** Regras de quantidade inteira e limitada, independentes da UI (testadas isoladamente). */
export function useQuantityStepper({
  value,
  defaultValue = 1,
  min = 1,
  max,
  onChange,
}: UseQuantityStepperParams): QuantityStepperState {
  const [current, setCurrent] = useControllableState({ value, defaultValue, onChange })
  const isUnavailable = max < min

  const commit = useCallback(
    (next: number) => {
      if (isUnavailable) return
      setCurrent(clamp(Math.trunc(next), min, max))
    },
    [isUnavailable, max, min, setCurrent],
  )

  const setFromInput = useCallback(
    (raw: string) => {
      const parsed = Number.parseFloat(raw)
      if (Number.isFinite(parsed)) commit(parsed)
    },
    [commit],
  )

  return {
    value: current,
    min,
    max,
    isUnavailable,
    canIncrement: !isUnavailable && current < max,
    canDecrement: !isUnavailable && current > min,
    increment: () => {
      commit(current + 1)
    },
    decrement: () => {
      commit(current - 1)
    },
    setFromInput,
  }
}
