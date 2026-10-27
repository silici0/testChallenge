# ADR-0004: TanStack Query como única camada de estado remoto

- **Status:** Aceita
- **Data:** 2026-10-27
- **Requisitos do enunciado:** §2, §4 (cache, invalidação, obsolescência, isolamento, otimista), §6

## Contexto

O enunciado exige consultas, mutations e sincronização via TanStack Query, descarte de respostas obsoletas, isolamento por usuário e por parâmetros, e ao menos uma atualização otimista com rollback, com política documentada.

## Decisão

- Todo dado remoto passa por TanStack Query; não há store global paralelo.
- Fábricas de query keys por feature; dados privados sob `['user', userId, …]`.
- `signal` repassado ao Axios em toda `queryFn`.
- Retries apenas para erros `retryable`; mutations sem retry, exceto criação de pedido com a mesma chave de idempotência.
- Mutations retornam o recurso atualizado e escrevem no cache com `setQueryData`; invalidação complementar documentada.
- Atualização otimista em favoritos com rollback em `onError`.
- Eventos Socket.IO escrevem no cache apenas após dedupe e checagem de versão (ADR-0008).

Política completa: `docs/cache-strategy.md`.

## Consequências

- Logout limpa dados privados com uma única chamada (`removeQueries(['user'])`).
- Necessário disciplina nas keys (revisada no lint via `@tanstack/eslint-plugin-query`).

## Alternativas consideradas

- Zustand/Redux para carrinho — duplicaria o estado do servidor e quebraria a coerência com a API.
