import type { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'

import { routeTree } from '@/routeTree.gen'
import type { RealtimeClient } from '@/shared/realtime'

import type { SessionManager } from './session-manager'

export interface RouterContext {
  queryClient: QueryClient
  session: SessionManager
  realtime: RealtimeClient
}

export function createAppRouter(context: RouterContext) {
  return createRouter({
    routeTree,
    context,
    defaultPreload: 'intent',
    // O TanStack Query controla o cache; o router sempre delega a ele.
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
