import { useEffect, useState } from 'react'

/** Atrasa a propagação de um valor até que ele fique estável por `delayMs` (ex.: busca do catálogo, 300 ms). */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebounced(value)
    }, delayMs)
    return () => {
      clearTimeout(timeout)
    }
  }, [value, delayMs])

  return debounced
}
