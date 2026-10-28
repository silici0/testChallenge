import { useQuery } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'

import type { User } from '@/contracts'

import { sessionQuery } from './api'
import { sessionStore } from './session-store'

export interface SessionView {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  guestCartId: string
}

/** Sessão para a UI: usuário do TanStack Query + identificadores de transporte do store. */
export function useSession(): SessionView {
  const snapshot = useSyncExternalStore(sessionStore.subscribe, sessionStore.getSnapshot)
  const { data, isPending } = useQuery(sessionQuery())
  const user = data ?? null
  return { user, isAuthenticated: user !== null, isLoading: isPending, guestCartId: snapshot.guestCartId }
}
