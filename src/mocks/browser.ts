import { setupWorker } from 'msw/browser'

import { isScenarioId, type ScenarioId } from './scenarios/definitions'
import { createMockServer } from './server'

/** Chaves do cliente limpas no reset (`?reset=1`): sessão, carrinho de visitante e checkout. */
const CLIENT_KEYS = ['auth:token', 'auth:expired', 'cart:guestId']
const CLIENT_SESSION_PREFIX = 'checkout:'

function clearClientState() {
  for (const key of CLIENT_KEYS) localStorage.removeItem(key)
  for (const key of Object.keys(sessionStorage))
    if (key.startsWith(CLIENT_SESSION_PREFIX)) sessionStorage.removeItem(key)
}

/** Lê e remove `?scenario=` e `?reset=1` da URL. */
function consumeUrlControls(): { scenario: ScenarioId | null; reset: boolean } {
  const url = new URL(location.href)
  const scenario = url.searchParams.get('scenario')
  const reset = url.searchParams.has('reset')
  if (!scenario && !reset) return { scenario: null, reset }
  url.searchParams.delete('scenario')
  url.searchParams.delete('reset')
  history.replaceState(history.state, '', url)
  return { scenario: isScenarioId(scenario) ? scenario : null, reset }
}

/** Inicia o MSW no navegador. Deve rodar antes de qualquer import de socket.io-client (ADR-0024). */
export async function startMocks() {
  const env = import.meta.env
  const storage = env.VITE_MOCK_PERSIST === 'false' ? null : localStorage
  const defaultScenario = isScenarioId(env.VITE_MOCK_DEFAULT_SCENARIO) ? env.VITE_MOCK_DEFAULT_SCENARIO : 'default'
  const server = await createMockServer({
    apiBase: env.VITE_API_BASE_URL || '/api/v1',
    requestTimeoutMs: Number(env.VITE_REQUEST_TIMEOUT_MS || 8000),
    socketUrl: env.VITE_SOCKET_URL || location.origin,
    storage,
    defaultScenario,
  })

  const controls = consumeUrlControls()
  if (controls.reset) {
    await server.db.reset()
    clearClientState()
    server.scenarios.activate(controls.scenario ?? defaultScenario)
  } else if (controls.scenario) {
    server.scenarios.activate(controls.scenario)
  }

  await setupWorker(...server.handlers).start({
    serviceWorker: { url: '/mockServiceWorker.js' },
    onUnhandledRequest: 'bypass',
    quiet: env.PROD,
  })
  server.effects.resumePending()
  return server
}
