# ADR-0011: Valores em ETH como string decimal e cálculo em bigint (wei)

- **Status:** Aceita
- **Data:** 2026-10-27
- **Requisitos do enunciado:** §3.2 (strings decimais, precisão em cálculo e apresentação, quantidades inteiras, cotação como referência)

## Contexto

`Number` perde precisão (`0.1 + 0.2`). O enunciado exige strings decimais no transporte e precisão nos cálculos e na apresentação.

## Decisão

- Contratos usam string decimal validada por regex (até 18 casas).
- `src/shared/lib/money.ts`: `parseEth(str) → bigint` (wei), `formatEth(bigint) → str`, `mul(wei, qty)`, `add`, `sub`, `percent(wei, bps)` com arredondamento explícito (half-even) apenas onde a regra de negócio define.
- O mesmo módulo é usado pelos mocks para calcular cotações, garantindo coerência.
- A UI exibe os valores retornados pela API (resumo e recibo) sem recalcular; arredondamento visual não é aplicado.
- Lint proíbe `parseFloat`/`Number()` em arquivos de `money`/`cart`/`checkout`.

## Consequências

- Sem dependência externa; `bigint` suportado nos navegadores-alvo.

## Alternativas consideradas

- `decimal.js`/`big.js` — funcional, mas dependência extra para operações simples.
