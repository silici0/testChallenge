/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_MOCKS: 'true' | 'false'
  readonly VITE_API_BASE_URL: string
  readonly VITE_SOCKET_URL: string
  readonly VITE_SOCKET_PATH: string
  readonly VITE_REQUEST_TIMEOUT_MS: string
  readonly VITE_MOCK_DEFAULT_SCENARIO: string
  readonly VITE_MOCK_PERSIST: 'true' | 'false'
  readonly VITE_MOCK_PANEL: 'true' | 'false'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
