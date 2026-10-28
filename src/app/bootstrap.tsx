import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { authApi } from '@/features/auth/api'
import { sessionStore } from '@/features/auth/session-store'
import { announce } from '@/shared/a11y'
import { configureHttpClient, createHttpClient } from '@/shared/api'
import { createEventGate, createRealtimeClient } from '@/shared/realtime'

import { appEnv } from './env'
import { createQueryClient } from './query-client'
import { createRealtimeSync } from './realtime-sync'
import { createAppRouter } from './router'
import { createSessionManager } from './session-manager'

/**
 * Composição do app (inversão de dependência): cada peça recebe suas dependências aqui.
 * Importado dinamicamente por main.tsx somente depois de o MSW estar ativo (ADR-0024).
 */
export function mountApp(container: HTMLElement) {
  const queryClient = createQueryClient()
  const gate = createEventGate()
  const sync = createRealtimeSync({ queryClient, gate, getUserId: () => sessionStore.getSnapshot().userId, announce })
  const realtime = createRealtimeClient({
    url: appEnv.socketUrl,
    path: appEnv.socketPath,
    loadIo: () => import('socket.io-client'),
    getToken: () => sessionStore.getSnapshot().token,
    onEvent: sync.handle,
    onReconnect: sync.reconcile,
  })

  // O router é criado depois da sessão (dependência circular); onExpired só roda após o primeiro render.
  const routerRef: { current?: ReturnType<typeof createAppRouter> } = {}
  const session = createSessionManager({
    queryClient,
    store: sessionStore,
    realtime,
    gate,
    announce,
    logoutRequest: authApi.logout,
    onExpired: () => {
      const redirect = routerRef.current?.state.location.href ?? '/'
      void routerRef.current?.navigate({ to: '/login', search: { redirect, reason: 'expired' } })
    },
  })

  configureHttpClient(
    createHttpClient({
      baseURL: appEnv.apiBaseUrl,
      timeoutMs: appEnv.requestTimeoutMs,
      getAuth: () => sessionStore.getSnapshot(),
      onSessionExpired: session.expire,
    }),
  )

  const router = createAppRouter({ queryClient, session, realtime })
  routerRef.current = router
  sync.recordRestVersions()
  void realtime.connect()

  createRoot(container).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
}
