# ADR-0007: Cenários declarativos, determinísticos e controlados pela rede

- **Status:** Aceita
- **Data:** 2026-10-27
- **Requisitos do enunciado:** §6 (cenários configuráveis e reproduzíveis), §9 (estado isolado, controle de relógio/latência/eventos)

## Contexto

É preciso reproduzir latência, timeouts, falhas, sessão expirada, conflitos, cupons, mudanças de preço, timeout de pedido e pagamento confirmado/recusado de forma determinística, tanto manualmente quanto nos testes.

## Decisão

- Cenários declarativos em `src/mocks/scenarios/` (dados + rede + regras + eventos), catálogo em `docs/mock-scenarios.md`.
- Aleatoriedade apenas via PRNG com seed por cenário; tempo apenas via `Date`/timers da página (controláveis por `page.clock`).
- Seleção por `?scenario=`, painel ou endpoints `/__mock/*`; reset por `?reset=1`, painel ou `POST /__mock/reset`.
- Endpoints de controle são tratados pelo MSW — os testes e o painel atuam como “operador do servidor”, nunca sobre o estado do cliente.

## Consequências

- Roteiros de falha do README e testes usam os mesmos cenários.
- Painel e endpoints de controle existem no deploy de demonstração; ficam visualmente separados e identificados como ferramenta de demonstração.

## Alternativas consideradas

- `page.route` do Playwright — não reutilizável em dev/demonstração e não cobre o socket.
