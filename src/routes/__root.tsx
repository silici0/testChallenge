import { createRootRouteWithContext, HeadContent, Outlet } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { lazy, Suspense, useSyncExternalStore } from 'react'

import { appEnv } from '@/app/env'
import type { RouterContext } from '@/app/router'
import { sessionQuery } from '@/features/auth/api'
import { SiteShell } from '@/features/layout/site-shell'
import { LiveRegions } from '@/shared/a11y'
import { Button, EmptyState } from '@/shared/ui'

// Ferramenta de demonstração: fora do bundle principal e ausente quando os mocks estão desligados.
const MockPanel =
  appEnv.enableMocks && appEnv.mockPanel
    ? lazy(() => import('@/features/mock-panel/mock-panel').then((module) => ({ default: module.MockPanel })))
    : null

export const Route = createRootRouteWithContext<RouterContext>()({
  // A sessão é resolvida antes de qualquer rota (guards de rotas privadas dependem dela).
  beforeLoad: async ({ context }) => ({
    user: await context.queryClient.query({ ...sessionQuery(), staleTime: 'static' }),
  }),
  component: RootLayout,
  notFoundComponent: NotFound,
})

function NotFound() {
  return (
    <EmptyState
      titleAs="h1"
      title="Página não encontrada."
      description="O endereço pode ter mudado ou não existir."
      action={
        <Button asChild variant="outline">
          <Link to="/">Voltar ao início</Link>
        </Button>
      }
    />
  )
}

function RealtimeStatus() {
  const { realtime } = Route.useRouteContext()
  const status = useSyncExternalStore(realtime.subscribeStatus, realtime.getStatus)
  const connected = status === 'connected'
  return (
    <p className="pb-4 text-center text-caption-sm text-foreground-muted" data-realtime-status={status}>
      <span aria-hidden="true" className={connected ? 'text-success' : 'text-danger-text'}>
        ●
      </span>{' '}
      {connected ? 'Tempo real conectado' : 'Tempo real desconectado'}
    </p>
  )
}

function RootLayout() {
  return (
    <>
      <HeadContent />
      <SiteShell>
        <Outlet />
      </SiteShell>
      <RealtimeStatus />
      <LiveRegions />
      {MockPanel && (
        <Suspense fallback={null}>
          <MockPanel />
        </Suspense>
      )}
    </>
  )
}
