# ADR-0021: Estratégia de testes — Vitest + Testing Library, Playwright, TDD e BDD

- **Status:** Aceita
- **Data:** 2026-10-27
- **Requisitos do enunciado:** §9; complementa [ADR-0014](0014-playwright-e2e-e-regressao-visual.md)

## Contexto

O enunciado exige Playwright para E2E e regressão visual. Faltava definir os níveis abaixo do E2E, o fluxo de escrita dos testes e a ferramenta de testes unitários.

## Decisão

| Nível               | Ferramenta                                | Escopo                                                                                                       | Comando             |
| ------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------- |
| Unitário            | **Vitest** + jsdom                        | Funções puras (`money`, `cn`), hooks (`renderHook`), regras de domínio                                       | `pnpm test:unit`    |
| Componente          | Vitest + **Testing Library** + user-event | Comportamento e acessibilidade observáveis (consultas por papel e nome, nunca por classe ou DOM interno)     | `pnpm test:unit`    |
| Story               | Storybook + Vitest browser (Chromium)     | `play` + axe em toda story                                                                                   | `pnpm test:stories` |
| Visual (componente) | Playwright                                | Uma captura por story `visual`                                                                               | `pnpm test:visual`  |
| E2E / BDD           | Playwright + **playwright-bdd**           | Funcionalidades em Gherkin pt-BR (`tests/e2e/features`), contra o build com MSW, em desktop, tablet e mobile | `pnpm test:e2e`     |

- **Vitest em vez de Jest:** usa a mesma configuração e os mesmos transforms do Vite (SVGR, aliases, Tailwind), é nativo em ESM e o mesmo runner serve para os testes de story.
- **Playwright em vez de Cypress:** é obrigatório pelo enunciado, e um runner só cobre E2E, visual e Lighthouse.
- **TDD** para lógica (bibliotecas, hooks, regras de domínio e contratos): escreve-se o teste, confirma-se que falha (vermelho), implementa-se o mínimo (verde) e depois refatora-se. Os primeiros módulos (`money`, `cn`, `useQuantityStepper`, `Button`) seguiram esse ciclo.
- **BDD** para fluxos de usuário: cada funcionalidade do §9 vira um `.feature` em português, com cenários `Dado/Quando/Então`. Os steps são reutilizáveis e tipados (`createBdd`), e as tags `@main` e `@responsive` definem os viewports.
- **Hooks** ficam em arquivos próprios e são testados isoladamente. Componentes de apresentação só recebem estado e callbacks (SRP).
- Toda nova unidade em `src/shared` precisa de teste. A cobertura é medida com `pnpm test:coverage`.

## Consequências

- A pirâmide fica explícita: muitos testes unitários rápidos, stories como testes de componente no navegador e poucos E2E por fluxo.
- Os relatórios ficam em `coverage/`, `playwright-report/` e `playwright-report/visual/`.

## Alternativas consideradas

- Jest: exigiria configuração paralela de transforms (SVG, CSS e ESM).
- Cypress: fora da stack obrigatória e redundante com o Playwright.
- Cucumber.js puro: o playwright-bdd mantém fixtures, traces e relatório nativos do Playwright.
