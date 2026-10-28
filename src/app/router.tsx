import type { QueryClient } from '@tanstack/react-query'
import { createRouter, type RouterHistory } from '@tanstack/react-router'

import { routeTree } from '@/routeTree.gen'
import type { RealtimeClient } from '@/shared/realtime'

import { parseSearch, stringifySearch } from './search-serializer'
import type { SessionManager } from './session-manager'

export interface RouterContext {
  queryClient: QueryClient
  session: SessionManager
  realtime: RealtimeClient
}

export function createAppRouter(context: RouterContext, history?: RouterHistory) {
  return createRouter({
    routeTree,
    context,
    ...(history ? { history } : {}),
    defaultPreload: 'intent',
    // O TanStack Query controla o cache; o router sempre delega a ele.
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
    parseSearch,
    stringifySearch,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
