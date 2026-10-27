# ADR-0006: MSW como servidor simulado com estado consistente

- **Status:** Aceita
- **Data:** 2026-10-27
- **Requisitos do enunciado:** §1, §6, §11 (eliminatórios: fluxos apenas visuais, compra sem resposta da simulação)

## Contexto

APIs, autenticação, carteiras e pagamentos devem funcionar com dados simulados na camada de rede, reutilizáveis em desenvolvimento, demonstração e testes. Componentes, hooks e o cliente Axios não podem conter respostas fictícias. O estado precisa ser consistente entre recursos, sobreviver a refresh e ter reset integral.

## Decisão

- MSW (`setupWorker`) intercepta REST e WebSocket; ativado por `VITE_ENABLE_MOCKS`, inclusive no build de demonstração.
- Banco em memória em `src/mocks/db` com funções de domínio que implementam as regras (disponibilidade, cotação, cupons, idempotência, merge de carrinho, isolamento por usuário) e publicam mudanças num barramento consumido pelo handler Socket.IO.
- Persistência em `localStorage` com versão de schema; reset restaura o seed do cenário integralmente.
- `src/mocks` só é importado dinamicamente por `src/main.tsx` (regra ESLint).
- `onUnhandledRequest: 'error'` em dev/teste para impedir chamadas não mockadas.

## Consequências

- O mesmo código roda em dev, preview, testes e deploy.
- O “servidor” vive na aba: sem sincronização entre abas (limitação documentada).

## Alternativas consideradas

- json-server/backend Node — exigiria serviço extra no deploy estático.
- Mocks no cliente Axios (adapter) — proibido pelo enunciado.
