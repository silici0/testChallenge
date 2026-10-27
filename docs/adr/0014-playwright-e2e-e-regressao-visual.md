# ADR-0014: Playwright contra o build de preview com mocks

- **Status:** Aceita
- **Data:** 2026-10-27
- **Requisitos do enunciado:** §9, §11 (eliminatório: ausência de testes E2E executáveis)

## Contexto

Os testes devem rodar com os mocks, cobrir 12 grupos de cenários, executar em Chromium desktop e mobile, ter regressão visual com baselines versionadas e dados estáveis, partir de estado isolado, controlar relógio/latência/eventos e entregar relatório HTML e traces.

## Decisão

- Playwright com `webServer` em `vite preview` do build com mocks (mesmo artefato do deploy).
- Projetos `desktop` (1440), `mobile` (390) e `tablet` (768, visual/responsivo).
- Fixtures `mock` e `auth` que atuam via endpoints `/__mock/*` e login real — sem manipular estado do cliente.
- `page.clock` para tempo; latência e eventos controlados pelos cenários.
- Baselines em `tests/e2e/__screenshots__/` geradas na imagem Docker oficial do Playwright.
- Relatório HTML e `trace: 'retain-on-failure'`.

Detalhes e matriz: `docs/testing.md`.

## Consequências

- Testes mais lentos que contra `vite dev`, porém fiéis ao deploy.

## Alternativas consideradas

- Cypress — fora da stack obrigatória.
