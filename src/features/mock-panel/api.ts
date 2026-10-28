import { queryOptions } from '@tanstack/react-query'

export interface MockScenario {
  id: string
  description: string
}

export interface MockScenarioList {
  active: string
  items: MockScenario[]
}

/**
 * Plano de controle da simulação (`/__mock/*`, ADR-0007). Não é a API de negócio:
 * usa `fetch` direto, sem a base `/api/v1`, sem autenticação e sem o tratamento de erros do cliente HTTP.
 */
async function control(method: string, path: string, body?: unknown): Promise<Response> {
  const response = await fetch(`/__mock${path}`, {
    method,
    body: body === undefined ? null : JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`${method} /__mock${path} → ${response.status}`)
  return response
}

export const mockPanelApi = {
  scenarios: async () => (await (await control('GET', '/scenarios')).json()) as MockScenarioList,
  activate: async (id: string) => {
    await control('PUT', '/scenario', { id })
  },
  setSocket: async (action: 'drop' | 'restore') => {
    await control('POST', `/socket/${action}`)
  },
}

export const mockScenariosQuery = () =>
  queryOptions({ queryKey: ['mock', 'scenarios'] as const, queryFn: mockPanelApi.scenarios, staleTime: 0 })
