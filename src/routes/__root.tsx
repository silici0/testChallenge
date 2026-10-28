import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { useSyncExternalStore } from 'react'

import type { RouterContext } from '@/app/router'
import { sessionQuery } from '@/features/auth/api'
import { LiveRegions } from '@/shared/a11y'

export const Route = createRootRouteWithContext<RouterContext>()({
  // A sessão é resolvida antes de qualquer rota (guards de rotas privadas dependem dela).
  beforeLoad: async ({ context }) => ({
    user: await context.queryClient.query({ ...sessionQuery(), staleTime: 'static' }),
  }),
  component: RootLayout,
  notFoundComponent: () => <p className="p-gutter text-body">Página não encontrada.</p>,
})

function RealtimeStatus() {
  const { realtime } = Route.useRouteContext()
  const status = useSyncExternalStore(realtime.subscribeStatus, realtime.getStatus)
  const label = status === 'connected' ? 'Tempo real conectado' : 'Tempo real desconectado'
  return (
    <p className="text-caption-sm text-foreground-muted" data-realtime-status={status}>
      <span aria-hidden="true" className={status === 'connected' ? 'text-success' : 'text-danger-text'}>
        ●
      </span>{' '}
      {label}
    </p>
  )
}

function RootLayout() {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-page px-gutter">
      <Outlet />
      <RealtimeStatus />
      <LiveRegions />
    </div>
  )
}
