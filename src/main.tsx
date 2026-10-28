import './styles/index.css'

import { appEnv } from './app/env'

/**
 * Ordem obrigatória (ADR-0024): o MSW precisa interceptar WebSocket antes de o socket.io-client ser
 * importado, então o app inteiro é carregado dinamicamente depois de startMocks().
 */
async function start() {
  const container = document.getElementById('root')
  if (!container) throw new Error('Elemento #root não encontrado')
  if (appEnv.enableMocks) {
    const { startMocks } = await import('./mocks/browser')
    await startMocks()
  }
  const { mountApp } = await import('./app/bootstrap')
  mountApp(container)
}

void start()
