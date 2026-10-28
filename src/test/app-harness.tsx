import { createMemoryHistory } from '@tanstack/react-router'
import { render } from '@testing-library/react'
import { setupWorker } from 'msw/browser'

import { createApp } from '@/app/bootstrap'
import { sessionStore } from '@/features/auth/session-store'
import { createMockServer, type MockServer } from '@/mocks/server'

let worker: ReturnType<typeof setupWorker> | null = null
let server: MockServer | null = null

/** Sobe o servidor simulado uma vez por arquivo de teste (REST + Socket.IO no Chromium). */
export async function startMockServer() {
  server = await createMockServer({
    apiBase: '/api/v1',
    requestTimeoutMs: 8000,
    socketUrl: location.origin,
    storage: null,
    defaultScenario: 'default',
  })
  worker = setupWorker(...server.handlers)
  await worker.start({ quiet: true, onUnhandledRequest: 'bypass' })
  return server
}

export function stopMockServer() {
  worker?.stop()
}

/** Monta o app real (router, query, sessão, tempo real) numa rota, com estado limpo. */
export async function renderApp(path: string) {
  await fetch('/__mock/reset', { method: 'POST', body: '{}' })
  localStorage.clear()
  sessionStore.signOut()
  const app = createApp({ history: createMemoryHistory({ initialEntries: [path] }) })
  const view = render(app.element)
  return {
    ...view,
    app,
    unmount: () => {
      view.unmount()
      app.dispose()
    },
  }
}
