import type { QueryClient } from '@tanstack/react-query'

import type { AuthResponse } from '@/contracts'
import type { SessionStore } from '@/features/auth/session-store'
import { queryKeys } from '@/shared/query'
import type { EventGate } from '@/shared/realtime'

import type { Announce } from './realtime-sync'

interface SessionManagerOptions {
  queryClient: QueryClient
  store: SessionStore
  realtime: { reconnect: () => Promise<void>; disconnect: () => void }
  gate: EventGate
  /** Navegação para o login preservando o contexto (redirect + reason=expired). */
  onExpired: () => void
  announce: Announce
  logoutRequest: () => Promise<unknown>
}

/**
 * Política de sessão (docs/session.md): login, logout, expiração e troca de usuário limpam dados privados
 * em cache, eventos memorizados e a conexão de tempo real da sessão anterior.
 */
export function createSessionManager({
  queryClient,
  store,
  realtime,
  gate,
  onExpired,
  announce,
  logoutRequest,
}: SessionManagerOptions) {
  const expiredTokens = new Set<string>()

  async function clearPrivateData() {
    await queryClient.cancelQueries({ queryKey: queryKeys.user.all() })
    queryClient.removeQueries({ queryKey: queryKeys.user.all() })
    gate.reset()
  }

  async function signedIn({ user, session }: AuthResponse) {
    const previousUser = store.getSnapshot().userId
    if (previousUser && previousUser !== user.id) await clearPrivateData()
    // O carrinho do visitante foi mesclado no servidor; o próximo visitante começa com outro id.
    queryClient.removeQueries({ queryKey: queryKeys.guestCart(store.getSnapshot().guestCartId) })
    store.rotateGuestCart()
    store.signIn(session.token, user.id)
    queryClient.setQueryData(queryKeys.session(), user)
    await realtime.reconnect()
  }

  /** Sai da sessão de forma síncrona (guards já veem visitante) e limpa o restante em seguida. */
  function signOutLocally(): Promise<void> {
    store.signOut()
    store.rotateGuestCart()
    queryClient.setQueryData(queryKeys.session(), null)
    return clearPrivateData().then(realtime.reconnect)
  }

  return {
    signedIn,
    logout: async () => {
      store.clearExpired()
      try {
        await logoutRequest()
      } catch {
        // a limpeza local acontece mesmo sem resposta da API
      }
      await signOutLocally()
    },
    /** Expirou e ainda não houve novo login/logout (persistido): o guard leva o motivo ao login. */
    hasExpired: () => store.wasExpired(),
    /** Chamado pelo cliente HTTP em SESSION_EXPIRED (uma vez por token). */
    expire: () => {
      const { token } = store.getSnapshot()
      if (!token || expiredTokens.has(token)) return
      expiredTokens.add(token)
      store.markExpired()
      announce('Sua sessão expirou. Entre novamente para continuar de onde parou.', 'assertive')
      void signOutLocally()
      onExpired()
    },
  }
}

export type SessionManager = ReturnType<typeof createSessionManager>
