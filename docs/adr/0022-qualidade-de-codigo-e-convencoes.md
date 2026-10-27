# ADR-0022: Qualidade de código — ESLint estrito, Prettier, Husky, lint-staged e Conventional Commits

- **Status:** Aceita
- **Data:** 2026-10-27
- **Requisitos do enunciado:** §11 (tipagem, responsabilidades, execução reproduzível), §12 (comandos de lint e tipos)

## Contexto

O avaliador analisa arquitetura, tipagem e responsabilidades. Regras precisam ser automáticas, não depender de revisão manual.

## Decisão

- **ESLint 10 (flat config):**
  - `typescript-eslint` `strictTypeChecked` + `stylisticTypeChecked`;
  - `react-hooks` (incluindo as regras do React Compiler);
  - `jsx-a11y` strict;
  - `@tanstack/eslint-plugin-query` e `-router`;
  - `testing-library`, `@vitest/eslint-plugin` e `storybook`;
  - `simple-import-sort`.
- **Clean code por regra:**
  - `complexity` ≤ 10, `max-depth` ≤ 3, `max-params` ≤ 3 (objetos de parâmetros) e `max-lines` ≤ 300;
  - `no-nested-ternary`;
  - imports de `src/mocks` proibidos fora do bootstrap.
- **Prettier** com `prettier-plugin-tailwindcss` (ordena classes, inclusive em `cva` e `cn`).
- **Husky:**
  - `pre-commit`: `lint-staged` (ESLint `--max-warnings=0`, Prettier, `vitest related` e regeneração de tokens);
  - `commit-msg`: commitlint com Conventional Commits e escopos do domínio;
  - `pre-push`: typecheck e testes unitários.
- **SOLID nos componentes:**
  - **S:** componente de apresentação, variantes (`*.variants.ts`) e regra em hook (`use-*`) ficam em arquivos separados;
  - **O:** extensão por props, variantes e `asChild`, sem modificar o componente;
  - **L:** componentes aceitam as props nativas do elemento (`ComponentProps<'button'>`);
  - **I:** props mínimas e específicas (`IconButton` exige `label`);
  - **D:** features dependem de abstrações (hooks, contratos, `ApiClient`), não de implementações (Axios, MSW).
- **TypeScript 6** com `strict`, `noUncheckedIndexedAccess` e `exactOptionalPropertyTypes`.

## Consequências

- Nenhum commit entra no repositório com erro de lint, tipo ou teste relacionado.
- O histórico segue Conventional Commits, o que permite gerar changelog.

## Alternativas consideradas

- Biome: mais rápido, mas sem as regras de React Hooks, jsx-a11y, Testing Library e TanStack.
