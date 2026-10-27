import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'

import type { RouterContext } from '@/app/router'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: () => <p className="p-gutter text-body">Página não encontrada.</p>,
})

function RootLayout() {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-page px-gutter">
      <Outlet />
    </div>
  )
}
