import { useRouteContext } from '@tanstack/react-router'
import { useEffect } from 'react'

/** Assina eventos dos NFTs em tela enquanto o componente estiver montado (listeners liberados no cleanup — §7). */
export function useNftSubscription(nftIds: string[]) {
  const { realtime } = useRouteContext({ from: '__root__' })
  const key = [...nftIds].sort().join(',')
  useEffect(() => {
    if (!key) return
    return realtime.subscribeNfts(key.split(','))
  }, [realtime, key])
}
