# ADR-0020: Storybook como documentação viva e bancada de testes de componentes

- **Status:** Aceita
- **Data:** 2026-10-27
- **Requisitos do enunciado:** §8 (estados e acessibilidade), §9 (regressão visual), §11 (documentação)

## Contexto

Cada componente precisa de documentação, variações, args e testes de interação, acessibilidade e tela. Isso precisa ficar perto do código e não pode duplicar setup.

## Decisão

- Storybook 10 (`@storybook/react-vite`) com `addon-docs` (autodocs global via `tags: ['autodocs']`), `addon-a11y` (`a11y.test: 'error'`) e `addon-vitest`.
- Toda story de componente declara `args`, `argTypes` e as variações relevantes, incluindo os estados dos requisitos: carregando, erro, desabilitado, limite, tempo real. Também tem uma story “Matriz” quando houver mais de uma dimensão de variante.
- Interações são verificadas com `play` (`storybook/test`). O projeto Vitest `storybook` roda **todas** as stories no Chromium (modo browser), executando `play` e o axe. Violação de acessibilidade falha o teste.
- **Teste de tela por componente:** `tests/visual/stories.spec.ts` (Playwright) captura cada story com a tag `visual` a partir do `storybook-static/index.json`. As baselines ficam versionadas em `tests/visual/__screenshots__/`.

## Consequências

- Uma story é, ao mesmo tempo, documentação, teste de interação, auditoria de acessibilidade e teste de regressão visual.
- O build do Storybook faz parte do teste visual (~20 s).

## Alternativas consideradas

- Storybook test-runner: substituído pelo addon-vitest, que é mais rápido e usa a mesma configuração do Vite.
- Chromatic: serviço externo e pago; o enunciado exige execução reproduzível sem serviços privados.
