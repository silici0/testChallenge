# Architecture Decision Records

Formato: [`0000-template.md`](0000-template.md). Processo: [ADR-0001](0001-registrar-decisoes-com-adr.md).

| ADR                                                             | Decisão                                                                   | Status | Enunciado    |
| --------------------------------------------------------------- | ------------------------------------------------------------------------- | ------ | ------------ |
| [0001](0001-registrar-decisoes-com-adr.md)                      | Registrar decisões com ADRs                                               | Aceita | §11, §12     |
| [0002](0002-vite-pnpm-e-organizacao-por-feature.md)             | Vite, pnpm e organização por feature                                      | Aceita | §2, §12      |
| [0003](0003-tanstack-router-file-based.md)                      | TanStack Router file-based e search params validados                      | Aceita | §2, §3, §4   |
| [0004](0004-tanstack-query-politica-de-cache.md)                | TanStack Query como única camada de estado remoto                         | Aceita | §2, §4       |
| [0005](0005-contratos-zod-compartilhados.md)                    | Contratos Zod compartilhados entre mocks e cliente                        | Aceita | §4, §5, §6   |
| [0006](0006-msw-como-servidor-simulado.md)                      | MSW como servidor simulado com estado consistente                         | Aceita | §1, §6       |
| [0007](0007-cenarios-deterministicos.md)                        | Cenários declarativos e determinísticos                                   | Aceita | §6, §9       |
| [0008](0008-socket-io-via-msw-binding.md)                       | Socket.IO real no cliente via `@mswjs/socket.io-binding`                  | Aceita | §6, §7       |
| [0009](0009-axios-cliente-http.md)                              | Cliente Axios único com normalização de erros                             | Aceita | §2, §4, §5   |
| [0010](0010-sessao-e-autenticacao-simuladas.md)                 | Sessão por token opaco e senhas com hash                                  | Aceita | §3.4         |
| [0011](0011-valores-eth-como-string-decimal.md)                 | ETH como string decimal e cálculo em bigint                               | Aceita | §3.2         |
| [0012](0012-checkout-maquina-de-estados-e-idempotencia.md)      | Checkout como máquina de estados com idempotência                         | Aceita | §3.3, §5, §7 |
| [0013](0013-tailwind-v4-e-shadcn-com-tokens-do-figma.md)        | Tailwind v4 e shadcn/ui com tokens do Figma                               | Aceita | §2, §8       |
| [0014](0014-playwright-e2e-e-regressao-visual.md)               | Playwright contra o build de preview com mocks                            | Aceita | §9           |
| [0015](0015-lighthouse-ci-com-mediana.md)                       | Lighthouse via `@lhci/cli` com mediana de 3 execuções                     | Aceita | §10          |
| [0016](0016-deploy-vercel-com-mocks.md)                         | Deploy na Vercel com mocks e fallback de SPA                              | Aceita | §6, §12      |
| [0017](0017-formularios-react-hook-form-e-zod.md)               | Formulários com React Hook Form + Zod                                     | Aceita | §3, §8       |
| [0018](0018-carrinho-no-servidor-com-merge-do-visitante.md)     | Carrinho no servidor simulado com merge do visitante                      | Aceita | §3.2         |
| [0019](0019-design-system-endemico-e-style-dictionary.md)       | Design system endêmico com tokens DTCG e Style Dictionary                 | Aceita | §8, §11      |
| [0020](0020-storybook-como-documentacao-e-bancada-de-testes.md) | Storybook como documentação viva e bancada de testes                      | Aceita | §8, §9, §11  |
| [0021](0021-estrategia-de-testes-tdd-e-bdd.md)                  | Vitest + Testing Library, Playwright, TDD e BDD                           | Aceita | §9           |
| [0022](0022-qualidade-de-codigo-e-convencoes.md)                | ESLint estrito, Prettier, Husky, lint-staged, Conventional Commits, SOLID | Aceita | §11, §12     |
| [0023](0023-fixacao-de-versoes-typescript-6-e-msw-2.md)         | Fixar TypeScript 6.x e MSW 2.x                                            | Aceita | §12          |
| [0024](0024-bootstrap-do-msw-e-socket-io.md)                    | Ordem de bootstrap do MSW e regras do Socket.IO simulado                  | Aceita | §6, §7       |
