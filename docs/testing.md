# Testes E2E e regressão visual (Playwright)

Decisão: [ADR-0014](adr/0014-playwright-e2e-e-regressao-visual.md).

## Execução

- `webServer`: `pnpm build && pnpm preview --port 4173` com `VITE_ENABLE_MOCKS=true` (testa o mesmo artefato publicado).
- Projetos:

| Projeto   | Navegador                         | Viewport   | Escopo                                   |
| --------- | --------------------------------- | ---------- | ---------------------------------------- |
| `desktop` | Chromium                          | 1440 × 900 | todos os specs                           |
| `mobile`  | Chromium (`isMobile`, `hasTouch`) | 390 × 844  | fluxos principais (tag `@main`) + visual |
| `tablet`  | Chromium                          | 768 × 1024 | visual + responsividade (`@responsive`)  |

- `reporter: [['html', { open: 'never' }], ['list']]`; `trace: 'retain-on-failure'`, `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`.
- `retries: 0` local, `1` em CI (testes instáveis devem ser corrigidos, não mascarados).

## Isolamento

Cada teste usa um `BrowserContext` novo (storage vazio) e a fixture `mock`:

```ts
test.use({ scenario: 'default' })
// fixture: antes do goto, addInitScript define localStorage['mock:scenario'] e chama POST /__mock/reset
```

- Seed fixo, PRNG fixo, sem dependência de ordem entre testes (`fullyParallel: true`).
- Helpers: `mock.setScenario(id)`, `mock.updateNft(id, patch)`, `mock.resolveOrder(id, status)`, `mock.dropSocket()`, `mock.restoreSocket()`, `mock.replayEvent(id)` — todos chamam os endpoints `/__mock/*` via `page.evaluate(fetch)`, ou seja, passam pelo MSW.
- `auth.loginAs('ana')`: login real pela UI ou pela API simulada (`POST /auth/login`), nunca injetando token fabricado.

## Tempo e eventos

- `page.clock.install({ time: '2026-01-15T12:00:00Z' })` nos cenários sensíveis a tempo; `page.clock.runFor()` avança latências, expiração de cotação e resolução de pedidos.
- Eventos de tempo real são disparados pelo mock (servidor) e chegam pelo `socket.io-client`; os testes nunca chamam funções do cliente nem manipulam o cache.
- Asserções observam a UI (`getByRole`, `toHaveText`, `toBeVisible`) e o resultado das operações (estado retornado por `GET /orders/:id`, `GET /cart`) — não detalhes de implementação.

## Matriz de cobertura (exigida pelo enunciado §9)

| #   | Spec                                     | Casos                                                                                                                                                                                                                                       |
| --- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `01-catalog-url-state.spec.ts`           | Busca, filtros combinados, ordenação, paginação, reset de página ao filtrar, refresh, voltar/avançar; `out-of-order` mostra o último termo; `empty-catalog`                                                                                 |
| 2   | `02-nft-detail.spec.ts`                  | Acesso direto, NFT inexistente (404), edição indisponível, limite de quantidade                                                                                                                                                             |
| 3   | `03-auth-session.spec.ts`                | Cadastro (+ `register-conflict` e validação), login, retorno ao fluxo, refresh mantém sessão, expiração (navegação e checkout), logout, troca de usuário sem vazamento de dados (favoritos/carrinho/pedidos de Ana não aparecem para Bruno) |
| 4   | `04-favorites.spec.ts`                   | Favoritar/desfavoritar, persistência após refresh, `favorite-failure` com rollback e anúncio, recuperação ao trocar para `default`                                                                                                          |
| 5   | `05-cart.spec.ts`                        | Adicionar, quantidades, limite, remover, cupom válido/inválido/expirado, refresh, merge visitante → login                                                                                                                                   |
| 6   | `06-purchase-happy-path.spec.ts` `@main` | Catálogo → detalhe → carrinho → login → pagamento → revisão → pendente → recibo confirmado; carrinho sem os itens comprados; recibo imutável após `mock.updateNft`                                                                          |
| 7   | `07-payment-failures.spec.ts`            | `payment-declined` preserva itens; clique repetido gera 1 pedido; `order-timeout` recupera o mesmo `orderId`                                                                                                                                |
| 8   | `08-account.spec.ts`                     | Perfil, avatar (upload), senha (atual incorreta), carteiras principal/secundária, `form-validation`, persistência após refresh                                                                                                              |
| 9   | `09-realtime-checkout.spec.ts`           | Item no carrinho, `nft.updated` de preço e de disponibilidade durante a navegação e no pagamento; aviso, resumo atualizado, confirmação bloqueada                                                                                           |
| 10  | `10-realtime-resilience.spec.ts`         | `duplicate-events` (efeito único, sem regressão de versão), `socket-drop-pending`, refresh com pedido pendente, estados terminais                                                                                                           |
| 11  | `11-a11y-keyboard.spec.ts`               | Fluxo de compra só com teclado, foco visível, trap/retorno de foco em dialog e drawer, erros associados (`aria-describedby`), `@axe-core/playwright` sem violações sérias                                                                   |
| 12  | `12-loading-errors.spec.ts`              | `slow-network` mostra skeletons (catálogo, detalhe, resumo do carrinho) sem CLS; `http-errors` mostra erro; nova tentativa recupera; `reduced-motion` desativa shimmer                                                                      |

## Regressão visual

- `toHaveScreenshot` de **Início, Detalhe, Carrinho e Pagamento** em `desktop`, `tablet` e `mobile`.
- Dados estáveis: cenário `default`, relógio congelado, animações desativadas (`animations: 'disabled'`), fontes locais aguardadas (`document.fonts.ready`), imagens carregadas.
- Baselines versionadas em `tests/e2e/__screenshots__/`, geradas em Linux pela imagem oficial `mcr.microsoft.com/playwright` (`pnpm test:e2e:update` documenta o comando com Docker) para evitar diferenças de renderização entre SOs.
- `maxDiffPixelRatio: 0.01`.

## Artefatos

- `playwright-report/` (HTML) e `test-results/` (traces de falhas) — gerados a cada execução; em CI são publicados como artifacts.
