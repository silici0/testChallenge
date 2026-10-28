import type { HttpClient } from './http-client'

let current: HttpClient | null = null

/** Injeção do cliente HTTP (composição em app/, substituível em testes). */
export function configureHttpClient(client: HttpClient): void {
  current = client
}

export function httpClient(): HttpClient {
  if (!current) throw new Error('Cliente HTTP não configurado: chame configureHttpClient() no bootstrap')
  return current
}
