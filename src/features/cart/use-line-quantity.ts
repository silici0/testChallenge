import { useEffect, useRef, useState } from 'react'

const DEBOUNCE_MS = 400

/**
 * Quantidade de uma linha do carrinho: a UI responde na hora e a API recebe só a última
 * quantidade após 400 ms sem mudanças (docs/cart.md). Mudanças vindas do servidor prevalecem.
 */
export function useLineQuantity({
  serverQuantity,
  commit,
}: {
  serverQuantity: number
  commit: (quantity: number) => void
}) {
  const [quantity, setQuantity] = useState(serverQuantity)
  const [synced, setSynced] = useState(serverQuantity)
  if (serverQuantity !== synced) {
    setSynced(serverQuantity)
    setQuantity(serverQuantity)
  }

  const commitRef = useRef(commit)
  useEffect(() => {
    commitRef.current = commit
  })

  useEffect(() => {
    if (quantity === serverQuantity) return
    const timeout = setTimeout(() => {
      commitRef.current(quantity)
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(timeout)
    }
  }, [quantity, serverQuantity])

  return { quantity, setQuantity }
}
