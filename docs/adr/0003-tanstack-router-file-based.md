# ADR-0003: TanStack Router com rotas file-based e search params validados

- **Status:** Aceita
- **Data:** 2026-10-27
- **Requisitos do enunciado:** §2, §3.1 (estado na URL), §3.4 (fluxos privados), §4 (rotas inexistentes, acesso direto)

## Contexto

Busca, filtros, ordenação e paginação devem compor a URL e sobreviver a refresh/histórico. Fluxos privados precisam de proteção e retorno ao fluxo anterior. Qualquer tela deve aceitar acesso direto.

## Decisão

- Rotas file-based em `src/routes/` com `autoCodeSplitting`.
- `validateSearch` com Zod em cada rota (`fallback` para valores inválidos, ex.: `page=abc` → 1); `search.middlewares` com `stripSearchParams` para omitir padrões e manter URLs canônicas.
- Mudança de filtro ⇒ `navigate({ search: (s) => ({ ...s, ...filtro, page: undefined }) })` — reinicia a paginação.
- Layout `_authenticated` com `beforeLoad` que lê `context.auth` (resolvido via `queryClient.ensureQueryData(['session'])`) e lança `redirect({ to: '/login', search: { redirect: location.href } })`.
- `loader` usa `queryClient.ensureQueryData` para pré-carregar; componentes leem com `useSuspenseQuery`/`useQuery` (fonte única = Query).
- `notFoundComponent` global e `notFound()` lançado quando a API responde 404 (NFT/pedido inexistente).
- `redirect` aceita apenas paths internos.

## Consequências

- Estado de navegação tipado e compartilhável por link.
- Router e Query integrados via `context` (`createRouter({ context: { queryClient, auth } })`).

## Alternativas consideradas

- React Router — fora da stack obrigatória.
- Rotas code-based — mais boilerplate sem ganho.
