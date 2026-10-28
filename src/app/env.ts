/** Configuração do ambiente (README §3), com padrões seguros para execução local. */
const env = import.meta.env

export const appEnv = {
  enableMocks: env.VITE_ENABLE_MOCKS !== 'false',
  apiBaseUrl: env.VITE_API_BASE_URL || '/api/v1',
  socketUrl: env.VITE_SOCKET_URL || globalThis.location.origin,
  socketPath: env.VITE_SOCKET_PATH || '/socket.io',
  requestTimeoutMs: Number(env.VITE_REQUEST_TIMEOUT_MS || 8000),
  mockPanel: env.VITE_MOCK_PANEL !== 'false',
} as const
