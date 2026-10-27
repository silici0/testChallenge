# ADR-0023: Fixar TypeScript 6.x e MSW 2.x

- **Status:** Aceita
- **Data:** 2026-10-27
- **Requisitos do enunciado:** §12 (execução a partir de checkout limpo)

## Contexto

No momento do setup, `latest` resolvia para TypeScript 7.0 (compilador nativo) e MSW 3.0.

- O TypeScript 7 não expõe a API JavaScript (`ts.createProgram` é `undefined`). O `typescript-eslint` (regras com tipo) e o `react-docgen-typescript` do Storybook dependem dela.
- O `@mswjs/socket.io-binding@0.2.0`, base do tempo real nos mocks (ADR-0008), declara peer `msw@^2.10.2`.

## Decisão

- `typescript@~6.0.3`, a última linha com API JS. Sem `baseUrl` (deprecado no 6), com `paths` relativos.
- `msw@^2` (2.15). O worker é gerado por `pnpm msw:init`.
- Reavaliar quando o `typescript-eslint` suportar o TS 7 e o binding declarar compatibilidade com o MSW 3.

## Consequências

- O lockfile garante as versões. Atualizações desses dois pacotes precisam de um novo ADR.
