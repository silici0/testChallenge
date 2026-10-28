# Testes

Decisões: [ADR-0014](adr/0014-playwright-e2e-e-regressao-visual.md) (Playwright), [ADR-0020](adr/0020-storybook-como-documentacao-e-bancada-de-testes.md) (Storybook) e [ADR-0021](adr/0021-estrategia-de-testes-tdd-e-bdd.md) (estratégia, TDD e BDD).

## Pirâmide

| Nível                              | Ferramenta                            | Onde                           | Comando                        | Ambiente                 |
| ---------------------------------- | ------------------------------------- | ------------------------------ | ------------------------------ | ------------------------ |
| Unitário (lógica, hooks)           | Vitest + jsdom                        | `src/**/*.test.ts`             | `pnpm test` / `pnpm test:unit` | Node                     |
| Componente                         | Vitest + Testing Library + user-event | `src/**/*.test.tsx`            | `pnpm test:unit`               | Node (jsdom)             |
| Story (interação + acessibilidade) | Storybook + Vitest browser + axe      | `src/**/*.stories.tsx`         | `pnpm test:stories`            | Chromium                 |
| Integração (MSW + Socket.IO reais) | Vitest browser                        | `src/**/*.browser.test.ts`     | `pnpm test:coverage`           | Chromium                 |
| Visual por componente              | Playwright sobre o Storybook estático | `tests/visual/`                | `pnpm test:visual`             | Docker (imagem oficial)  |
| E2E / BDD                          | Playwright + playwright-bdd           | `tests/e2e/features/*.feature` | `pnpm test:e2e`                | Build + MSW, 3 viewports |
| Performance                        | Lighthouse CI                         | `lighthouse/`                  | `pnpm lighthouse`              | Build + MSW              |

`pnpm test:coverage` roda os testes unitários, de integração e de story juntos e aplica os limites de cobertura. O mesmo comando roda no `pre-push` e na CI.

## Cobertura

Medida com v8 sobre unitários, integração e stories (as stories cobrem o que o jsdom não renderiza, como o posicionamento do Select e as animações do Toaster). Relatório em `coverage/`.

| Escopo                | Statements | Branches | Functions | Lines |
| --------------------- | ---------: | -------: | --------: | ----: |
| Global                |       85 % |     75 % |      85 % |  85 % |
| `src/shared/lib/**`   |       95 % |     95 % |      95 % |  95 % |
| `src/shared/hooks/**` |       95 % |     90 % |      95 % |  95 % |

Ficam fora da medição: rotas e bootstrap (`src/routes`, `src/app`, `main.tsx`), cobertos pelo E2E; arquivos gerados; mocks; o dicionário de tokens, que é só documentação.

## Unitários e de componente

- Consultas por papel e nome acessível (`getByRole`, `getByLabelText`). Acesso direto ao DOM e `container` são proibidos pelo ESLint (`testing-library/no-node-access`).
- Interação com `userEvent`, nunca `fireEvent`, para simular teclado e foco reais.
- Hooks testados com `renderHook`, isolados da UI.
- `src/test/setup.ts` fornece `ResizeObserver` e as APIs de pointer capture que o jsdom não tem e que as primitivas Radix usam.

## Integração (navegador real)

Arquivos `*.browser.test.ts` rodam no Chromium com o MSW de verdade: service worker para REST e interceptação de WebSocket para o Socket.IO. No Node, o `socket.io-client` usa o pacote `ws`, que o MSW não intercepta ([ADR-0024](adr/0024-bootstrap-do-msw-e-socket-io.md)).

| Arquivo                                               | Garante                                                                                                                           |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `src/mocks/socket-binding.browser.test.ts`            | Premissas do `@mswjs/socket.io-binding` (matching por origem, token na query, import tardio)                                      |
| `src/mocks/server.browser.test.ts`                    | Compra completa com idempotência, eventos privados isolados, REST e evento com a mesma versão, sessão expirada, merge do carrinho |
| `src/features/api.browser.test.ts`                    | **Teste de contrato:** cada função de API das features contra os handlers simulados                                               |
| `src/shared/realtime/realtime-client.browser.test.ts` | Conexão, validação de eventos, reassinatura e reconciliação após queda                                                            |

## Stories

- Toda story roda como teste no Chromium: renderização, `play` (quando há) e axe com `a11y.test: 'error'`. Uma violação de acessibilidade falha o teste.
- Uma regra do axe só pode ser desativada por story, com a justificativa no código (exemplo: `aria-hidden-focus` no Select aberto, comportamento intencional do Radix).

## Regressão visual por componente

- `tests/visual/stories.spec.ts` lê o `storybook-static/index.json` e captura cada story com a tag `visual`. Stories que usam portal (dialog, sheet, select aberto) também levam a tag `visual:page` e capturam a página inteira.
- Para estabilizar a captura: movimento reduzido emulado, animações desativadas, espera pelas fontes, pela decodificação das imagens e por `document.getAnimations()`. Em diálogos, o foco vai para o próprio container, porque depois de `blur()` o trap de foco devolve o foco a um elemento diferente a cada execução.
- **As baselines são geradas e comparadas dentro de `mcr.microsoft.com/playwright:v<versão>-noble`** (`scripts/playwright-docker.sh`), com a mesma versão do `@playwright/test`. A renderização de fontes muda entre sistemas operacionais, então rodar fora do container (`pnpm test:visual:local`) serve só para depuração. `node scripts/check-playwright-image.mjs` garante que a imagem da CI acompanha o lockfile.
- **Tolerância zero** (`maxDiffPixels: 0`, apenas variação de cor por antialiasing): como o container é determinístico, qualquer pixel diferente falha. Uma tolerância percentual deixaria passar regressões finas, como uma borda de 1px; isso aconteceu e motivou a regra.
- As baselines ficam versionadas em `tests/visual/__screenshots__/`. Para atualizar, rode `pnpm test:visual:update`, que regrava **todas** as capturas (`--update-snapshots=all`), e revise as imagens no diff do PR.

## E2E / BDD

- As funcionalidades ficam em Gherkin pt-BR (`# language: pt`) em `tests/e2e/features/`. Os steps reutilizáveis e tipados (`createBdd`) ficam em `tests/e2e/steps/`. O `bddgen` gera os specs em `.features-gen/`, que é ignorado pelo git.
- Os testes rodam contra o mesmo artefato do deploy: `pnpm build && pnpm preview`, com `VITE_ENABLE_MOCKS=true`.
- Viewports por tag:

| Projeto   | Viewport            | Executa                |
| --------- | ------------------- | ---------------------- |
| `desktop` | 1440 × 900          | todos os cenários      |
| `mobile`  | 390 × 844 (Pixel 7) | `@main`, `@responsive` |
| `tablet`  | 768 × 1024          | `@responsive`          |

- Relatório HTML em `playwright-report/` (`pnpm test:e2e:report`). Em caso de falha são gravados trace, vídeo e screenshot em `test-results/`.

### Isolamento e controle (a implementar com a camada de mocks)

- Cada cenário roda num contexto de navegador novo. A fixture `mock` (em `tests/e2e/steps/fixtures.ts`) seleciona o cenário e chama `POST /__mock/reset` antes do `goto` ([mock-scenarios.md](mock-scenarios.md#endpoints-de-controle)).
- O tempo é controlado por `page.clock` nos cenários sensíveis (latência, expiração de cotação, resolução de pedido), porque os timers do MSW rodam na página.
- Os eventos de tempo real são disparados pelo servidor simulado (endpoints `/__mock/*`) e chegam pelo `socket.io-client`. Os testes nunca manipulam o cache nem o estado do cliente.
- O login é feito pela UI ou pela API simulada, nunca com token fabricado.

## Matriz do enunciado (§9) → funcionalidades BDD

| #   | Funcionalidade (`tests/e2e/features/`) | Cobertura                                                                                                          | Status                                                                                |
| --- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| 1   | `catalogo.feature`                     | Busca, filtros combinados, ordenação, paginação, reset da página, refresh, histórico, `out-of-order`, vazio        | ✅                                                                                    |
| 2   | `detalhe.feature`                      | Acesso direto, inexistente, edição indisponível, limite de quantidade                                              | ✅                                                                                    |
| 3   | `conta-e-sessao.feature`               | Cadastro (conflito/validação), login, retorno ao fluxo, refresh, expiração, logout, troca de usuário sem vazamento | ✅                                                                                    |
| 4   | `favoritos.feature`                    | Favoritar/desfavoritar, persistência, falha com rollback, recuperação                                              | ✅                                                                                    |
| 5   | `carrinho.feature`                     | Adicionar, quantidades, limite, remover, cupons, refresh, merge visitante → login                                  | ✅                                                                                    |
| 6   | `compra.feature` `@main`               | Catálogo → recibo confirmado; carrinho sem os itens comprados; recibo imutável                                     | ✅                                                                                    |
| 7   | `falhas-de-pagamento.feature`          | Recusa, clique repetido, timeout com o mesmo pedido                                                                | ✅                                                                                    |
| 8   | `perfil.feature` `carteiras.feature`   | Perfil, avatar, senha, carteiras, erros de validação, persistência                                                 | ✅                                                                                    |
| 9   | `tempo-real-checkout.feature`          | `nft.updated` de preço/disponibilidade durante o checkout                                                          | ✅                                                                                    |
| 10  | `tempo-real-resiliencia.feature`       | Duplicados/antigos, queda do socket, refresh com pedido pendente                                                   | ✅                                                                                    |
| 11  | `acessibilidade.feature`               | Compra só com teclado, foco de diálogos, validação de formulários, axe                                             | ✅ (axe em 9 rotas, skip link, foco em diálogo e formulário, compra só com teclado)   |
| 12  | `carregamento-e-erros.feature`         | Skeletons em rede lenta, sem CLS, erro e nova tentativa, movimento reduzido                                        | ✅ (skeleton em rede lenta, CLS < 0.1, retry manual e automático, movimento reduzido) |
| —   | `home.feature`                         | Smoke: acesso direto, sem rolagem horizontal, rota inexistente                                                     | ✅                                                                                    |
| —   | `painel-de-simulacao.feature`          | Painel de demonstração: aplicar cenário, resetar dados, derrubar/restaurar o socket                                | ✅                                                                                    |

## Regressão visual de página

Exigida no §9: Início, Detalhe, Carrinho e Pagamento em `desktop` (1440), `tablet` (768) e `mobile` (390). A config é `playwright.pages.config.ts` e o spec é `tests/visual-pages/pages.spec.ts`. O teste roda sobre o build de produção com o servidor simulado.

- Relógio fixo (`page.clock.setFixedTime`), banco simulado resetado (`?reset=1`), tempo real conectado, nenhum `aria-busy`, imagens lazy forçadas para `eager` e decodificadas, captura de página inteira.
- Mesmo critério das stories: container do Playwright e tolerância zero. Duas regravações seguidas geram arquivos idênticos byte a byte.
- Baselines em `tests/visual-pages/__screenshots__/<viewport>/`. Comandos: `pnpm test:visual:pages` para comparar e `pnpm test:visual:pages:update` para regravar.
- No mobile, a barra inferior fixa aparece no ponto da viewport dentro da captura de página inteira. É o comportamento do Playwright para elementos `fixed` e é determinístico.

## CI (`.github/workflows/ci.yml`)

| Job          | Executa                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| `quality`    | Tokens sincronizados, typecheck, lint, Prettier, versão da imagem do Playwright e commitlint (em PRs) |
| `tests`      | `pnpm test:coverage` (unitários + stories no Chromium) e artefato `coverage/`                         |
| `visual`     | Regressão visual dos componentes e das páginas no container do Playwright                             |
| `e2e`        | BDD/E2E nos 3 viewports, no container; artefato com relatório e traces                                |
| `lighthouse` | Somente na `main`: `pnpm lighthouse` e artefato com os relatórios                                     |
