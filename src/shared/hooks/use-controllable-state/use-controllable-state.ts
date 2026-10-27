import { useCallback, useState } from 'react'

export interface UseControllableStateParams<T> {
  value?: T | undefined
  defaultValue: T
  onChange?: ((value: T) => void) | undefined
}

/**
 * Permite que um componente seja controlado (`value` + `onChange`) ou não controlado (`defaultValue`)
 * sem duplicar lógica — princípio aberto/fechado para os componentes de formulário.
 */
export function useControllableState<T>({ value, defaultValue, onChange }: UseControllableStateParams<T>) {
  const [internal, setInternal] = useState(defaultValue)
  const isControlled = value !== undefined
  const current = isControlled ? value : internal

  const setValue = useCallback(
    (next: T) => {
      if (Object.is(next, current)) return
      if (!isControlled) setInternal(next)
      onChange?.(next)
    },
    [current, isControlled, onChange],
  )

  return [current, setValue] as const
}
