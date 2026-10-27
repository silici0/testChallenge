# ADR-0002: Vite, pnpm e organização por feature

- **Status:** Aceita
- **Data:** 2026-10-27
- **Requisitos do enunciado:** §2 (build e organização a critério), §12 (checkout limpo, lockfile, comandos)

## Contexto

A aplicação é uma SPA sem SSR (todo dado vem do MSW no navegador). O deploy recomendado é Vercel com Vite. A entrega precisa rodar de um checkout limpo com lockfile.

## Decisão

- **Vite** como build e dev server; plugin `@tanstack/router-plugin/vite` (geração de rotas e code splitting) e `@tailwindcss/vite`.
- **pnpm** via Corepack, `packageManager` fixado em `package.json`, `pnpm-lock.yaml` versionado, `engines.node` = 22.
- TypeScript `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- Organização por domínio em `src/features/<domínio>` com camadas compartilhadas em `src/shared`, contratos em `src/contracts` e mocks isolados em `src/mocks` (ver `ARCHITECTURE.md`).

## Consequências

- Build estático simples para Vercel/Netlify/Cloudflare.
- Sem SSR: SEO depende de metadados estáticos e por rota (aceitável para as metas de Lighthouse).

## Alternativas consideradas

- TanStack Start / Next.js — SSR não agrega com dados 100 % simulados no cliente e complica MSW.
- npm/yarn — pnpm é mais rápido e estrito com dependências fantasmas.
