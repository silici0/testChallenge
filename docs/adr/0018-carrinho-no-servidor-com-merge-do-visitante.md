# ADR-0018: Carrinho no servidor simulado, com carrinho de visitante e merge no login

- **Status:** Aceita
- **Data:** 2026-10-27
- **Requisitos do enunciado:** §3.2 (persistência após refresh, preservar itens do visitante ao autenticar, resumo coerente com a API, tempo real)

## Contexto

O carrinho deve sobreviver a refresh, manter itens do visitante ao autenticar, refletir disponibilidade e preço, e ter resumo coerente com a API. Manter o carrinho no cliente duplicaria regras e criaria divergência com a cotação.

## Decisão

- Carrinho é recurso do servidor simulado; visitante identificado por `X-Guest-Cart-Id`.
- Login/cadastro recebem `guestCartId` e o servidor mescla (soma limitada pela disponibilidade, com `issues`).
- Resumo (`subtotal`, `desconto`, `taxa`, `total`) sempre calculado pelo servidor.
- `nft.updated` invalida o carrinho; `issues` descrevem alterações.

Detalhes: `docs/cart.md`.

## Consequências

- Toda alteração de quantidade é uma requisição (mitigado com debounce e preview local da linha).

## Alternativas consideradas

- Carrinho local em `localStorage` sincronizado no checkout — resumo incoerente com a API e regras duplicadas.
