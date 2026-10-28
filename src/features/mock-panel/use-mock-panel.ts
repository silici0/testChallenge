import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { mockPanelApi, mockScenariosQuery } from './api'

export interface UseMockPanelOptions {
  /** Navegação completa usada pelo reset (injetável nos testes). */
  navigate?: (url: string) => void
}

/** Ações do painel de demonstração: trocar cenário, derrubar/restaurar o socket e resetar os dados. */
export function useMockPanel({ navigate = (url) => window.location.assign(url) }: UseMockPanelOptions = {}) {
  const queryClient = useQueryClient()
  const scenarios = useQuery(mockScenariosQuery())

  const activate = useMutation({
    mutationFn: mockPanelApi.activate,
    // O novo cenário vale para as próximas requisições: refaz as consultas ativas para refleti-lo já.
    onSuccess: () => queryClient.invalidateQueries(),
  })
  const socket = useMutation({ mutationFn: mockPanelApi.setSocket })

  return {
    scenarios: scenarios.data?.items ?? [],
    active: scenarios.data?.active,
    activate: (id: string) => activate.mutate(id),
    dropSocket: () => socket.mutate('drop'),
    restoreSocket: () => socket.mutate('restore'),
    // `?reset=1` restaura o seed e limpa a sessão, o carrinho de visitante e o checkout do cliente (src/mocks/browser.ts).
    reset: () => navigate('/?reset=1'),
    isPending: activate.isPending || socket.isPending,
  }
}
