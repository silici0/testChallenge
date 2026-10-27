# Rastreabilidade: enunciado → solução → evidência

Fonte: [junglegaming/frontend-challenge](https://github.com/junglegaming/frontend-challenge) (README lido em 2026-10-27). Marcar `Status` como ✅ apenas quando a implementação **e** o teste/evidência existirem.

Legenda: ⬜ pendente · 🟡 em andamento · ✅ entregue

## Eliminatórios (§11)

| Critério eliminatório                        | Como é evitado                                                          | Evidência                                                                        | Status |
| -------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------ |
| Ausência de uso efetivo da stack obrigatória | Cada tecnologia tem papel definido ([README §1](../README.md#1-stack))  | ADRs 0002–0016                                                                   | ⬜     |
| Fluxos principais apenas visuais             | Todos os fluxos chamam a API simulada                                   | specs 03, 05, 06, 08                                                             | ⬜     |
| Compra confirmada sem resposta da simulação  | Recibo só com `status: confirmed` da API/evento                         | spec 06, 07 · [ADR-0012](adr/0012-checkout-maquina-de-estados-e-idempotencia.md) | ⬜     |
| Exposição de dados entre usuários            | Keys `['user', uid]`, limpeza no logout, salas por usuário, 403 no mock | spec 03 (troca de usuário), spec 10                                              | ⬜     |
| Eventos simulados diretamente na UI          | Eventos só via `socket.io-client` + MSW binding                         | specs 09, 10 · [ADR-0008](adr/0008-socket-io-via-msw-binding.md)                 | ⬜     |
| Ausência de testes E2E executáveis           | `pnpm test:e2e` a partir de checkout limpo                              | CI + relatório HTML                                                              | ⬜     |

## §1 Escopo

| Requisito                                     | Solução                                                                       | Status |
| --------------------------------------------- | ----------------------------------------------------------------------------- | ------ |
| Descoberta, compra e conta, desktop e mobile  | Rotas em [ARCHITECTURE §3](../ARCHITECTURE.md#3-rotas)                        | ⬜     |
| APIs, auth, carteiras e pagamentos simulados  | [mock-scenarios.md](mock-scenarios.md)                                        | ⬜     |
| Estados não desenhados seguem o padrão visual | Componentes de estado compartilhados (`EmptyState`, `ErrorState`, `Skeleton`) | ⬜     |

## §2 Stack obrigatória

| Tecnologia              | Uso efetivo                                                                           | Status |
| ----------------------- | ------------------------------------------------------------------------------------- | ------ |
| React, TypeScript       | App inteira, `strict`                                                                 | ⬜     |
| TanStack Router         | Rotas, search params, guards ([ADR-0003](adr/0003-tanstack-router-file-based.md))     | ⬜     |
| TanStack Query          | Todas as queries/mutations ([ADR-0004](adr/0004-tanstack-query-politica-de-cache.md)) | ⬜     |
| Axios                   | Único cliente HTTP ([ADR-0009](adr/0009-axios-cliente-http.md))                       | ⬜     |
| REST                    | [api-contracts.md](api-contracts.md)                                                  | ⬜     |
| Socket.IO               | `nft.updated`, `order.updated` ([realtime.md](realtime.md))                           | ⬜     |
| Tailwind CSS, shadcn/ui | [ADR-0013](adr/0013-tailwind-v4-e-shadcn-com-tokens-do-figma.md)                      | ⬜     |
| MSW                     | REST + WebSocket ([ADR-0006](adr/0006-msw-como-servidor-simulado.md))                 | ⬜     |
| Playwright              | [testing.md](testing.md)                                                              | ⬜     |
| Lighthouse              | [performance.md](performance.md)                                                      | ⬜     |

## §3 Telas e fluxos

| Tela                                                            | Funcionalidades                                                    | Spec                   | Status |
| --------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------- | ------ |
| Início                                                          | Destaques, catálogo, busca, filtros, ordenação, navegação para NFT | 01                     | ⬜     |
| Detalhes do NFT                                                 | Galeria, informações, edição, quantidade, favoritos, compra        | 02, 04                 | ⬜     |
| Carrinho                                                        | Quantidades, remoção, cupom, resumo                                | 05                     | ⬜     |
| Pagamento                                                       | Dados do colecionador, carteira e rede, revisão, envio             | 06, 07, 09             | ⬜     |
| Confirmação                                                     | Resultado, transação, itens, taxas, total                          | 06                     | ⬜     |
| Login                                                           | Autenticação, validação, retorno ao fluxo                          | 03                     | ⬜     |
| Cadastro                                                        | Criação, validação, conflito                                       | 03                     | ⬜     |
| Perfil                                                          | Dados, avatar, senha                                               | 08                     | ⬜     |
| Carteiras                                                       | Principal e secundária, cadastro e edição                          | 08                     | ⬜     |
| Frames desktop e mobile; perfil/carteiras/confirmação em mobile | Layout responsivo 390/768/1440                                     | visual + `@responsive` | ⬜     |
| Ações fora do escopo não aparentam sucesso                      | [ARCHITECTURE §5](../ARCHITECTURE.md#5-decisões-de-ux)             | 11                     | ⬜     |

### Catálogo e detalhe

| Requisito                                                        | Solução                                     | Spec   | Status |
| ---------------------------------------------------------------- | ------------------------------------------- | ------ | ------ |
| Busca/filtros/ordenação/paginação na URL, refresh e histórico    | `validateSearch`                            | 01     | ⬜     |
| Filtros combináveis; mudança reinicia paginação                  | `page: undefined` ao filtrar                | 01     | ⬜     |
| Consultas refletem parâmetros; vazio, falha, fora de ordem       | Keys por params, `signal`, `appliedFilters` | 01, 12 | ⬜     |
| Detalhe: acesso direto, inexistente, edição indisponível, limite | `notFound()`, stepper limitado              | 02     | ⬜     |
| Favoritos persistem para o usuário                               | `/me/favorites`                             | 04     | ⬜     |

### Carrinho

| Requisito                                                              | Solução                                                             | Spec   | Status |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------- | ------ | ------ |
| Adicionar/alterar/remover respeitando disponibilidade por NFT e edição | API + 409                                                           | 05     | ⬜     |
| Persistir após refresh; preservar itens do visitante ao autenticar     | [ADR-0018](adr/0018-carrinho-no-servidor-com-merge-do-visitante.md) | 05     | ⬜     |
| Cupom aplicar/remover, inválido/expirado                               | `PUT/DELETE /cart/coupon`                                           | 05     | ⬜     |
| Subtotal, desconto, taxa e total da API                                | `Cart.summary`                                                      | 05     | ⬜     |
| Refletir preço/disponibilidade em tempo real                           | `nft.updated` → `issues`                                            | 09     | ⬜     |
| ETH como string decimal, precisão; quantidades inteiras                | [ADR-0011](adr/0011-valores-eth-como-string-decimal.md)             | 05, 06 | ⬜     |

### Pagamento e confirmação

| Requisito                                                         | Solução                                   | Spec   | Status |
| ----------------------------------------------------------------- | ----------------------------------------- | ------ | ------ |
| Validar campos e revisar antes do envio                           | Etapas `details/wallet/review`            | 06, 11 | ⬜     |
| Carteiras cadastradas, rede, conexão/recusa/desconexão            | `/me/wallets/*/connect`, `wallet.updated` | 07     | ⬜     |
| Revalidar preço, disponibilidade, cupom e taxas; nova confirmação | `409 QUOTE_STALE`                         | 09     | ⬜     |
| Impedir duplicados (cliques, timeout)                             | `Idempotency-Key` por tentativa           | 07     | ⬜     |
| Pendente/confirmado/recusado com recuperação                      | `checkout:attempt`, reconciliação         | 07, 10 | ⬜     |
| Confirmação só para pedido confirmado                             | Recibo condicionado ao status             | 06     | ⬜     |
| Preservar itens em falha; remover só o comprado                   | Servidor remove pelo `receipt`            | 06, 07 | ⬜     |
| Recibo é snapshot imutável                                        | `order.receipt`                           | 06     | ⬜     |

### Conta e sessão

| Requisito                                                   | Solução                                                   | Spec              | Status |
| ----------------------------------------------------------- | --------------------------------------------------------- | ----------------- | ------ |
| Cadastro, login, logout, sessão integrados à API            | `/auth/*`                                                 | 03                | ⬜     |
| Checkout, perfil, carteiras, favoritos, pedidos exigem auth | `_authenticated` + 401/403 no mock                        | 03                | ⬜     |
| Sessão recuperável após refresh                             | Token + `GET /auth/session`                               | 03                | ⬜     |
| Expiração na navegação e no checkout com retomada           | [session.md](session.md#expiração)                        | 03                | ⬜     |
| Logout/troca limpam cache privado e subscriptions           | [session.md](session.md#logout-e-troca-de-usuário)        | 03, 10            | ⬜     |
| Validação de formulários + erros da API                     | [ADR-0017](adr/0017-formularios-react-hook-form-e-zod.md) | 03, 08            | ⬜     |
| Alterações persistem após refresh                           | Banco simulado persistido                                 | 08                | ⬜     |
| Credenciais fictícias, senhas sem texto claro               | PBKDF2 no mock                                            | revisão de código | ⬜     |

## §4 Integração e estado

| Requisito                                              | Solução                                                           | Status |
| ------------------------------------------------------ | ----------------------------------------------------------------- | ------ |
| Contratos tipados transporte ↔ estado ↔ UI             | [ADR-0005](adr/0005-contratos-zod-compartilhados.md)              | ⬜     |
| Carregamento, vazio, erro, sucesso, background         | [cache-strategy.md](cache-strategy.md#estados-exibidos)           | ⬜     |
| Invalidação após mutations e eventos                   | [cache-strategy.md](cache-strategy.md#invalidação-após-mutations) | ⬜     |
| Cancelamento/descarte de respostas obsoletas           | `signal` + keys                                                   | ⬜     |
| Isolamento por usuário e parâmetros                    | `['user', uid]`, `normalizedParams`                               | ⬜     |
| Recuperação sem duplicar operações                     | Retries só em retryable; idempotência                             | ⬜     |
| Rotas inexistentes e acesso direto                     | `notFoundComponent`, rewrites da Vercel                           | ⬜     |
| Atualização otimista com rollback                      | Favoritos                                                         | ⬜     |
| Política de cache, retries e sincronização documentada | [cache-strategy.md](cache-strategy.md)                            | ✅     |

## §5 Contratos REST

| Requisito                                                                                 | Solução                                               | Status           |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------- | ---------------- |
| Recursos mínimos (sessão, NFTs, favoritos, carrinho, cotação, pedidos, perfil, carteiras) | [api-contracts.md](api-contracts.md)                  | ✅ (documentado) |
| Erros: validação, sessão, permissão, inexistente, disponibilidade, transitória            | [Envelope de erro](api-contracts.md#envelope-de-erro) | ✅ (documentado) |
| Idempotência; mesma tentativa = mesmo pedido; conteúdo diferente = conflito               | `POST /orders`                                        | ✅ (documentado) |

## §6 Mocking

| Requisito                                                                      | Solução                                                  | Status |
| ------------------------------------------------------------------------------ | -------------------------------------------------------- | ------ |
| Mocks na camada de rede, reutilizados em dev/demo/testes                       | [ADR-0006](adr/0006-msw-como-servidor-simulado.md)       | ⬜     |
| Nenhuma resposta fictícia em componentes/hooks/Axios                           | Regra ESLint                                             | ⬜     |
| Estado consistente entre recursos; persistência; reset integral                | `src/mocks/db`                                           | ⬜     |
| Lentidão, latência variável, timeouts, offline, erros HTTP configuráveis       | [Simulação de rede](mock-scenarios.md#simulação-de-rede) | ⬜     |
| Fixtures: variedade, ≥ 2 usuários                                              | 63 NFTs, Ana e Bruno                                     | ⬜     |
| Cenários determinísticos listados                                              | [Catálogo](mock-scenarios.md#cenários-srcmocksscenarios) | ⬜     |
| Eventos via MSW compatível com Socket.IO; transporte e limitações documentados | [realtime.md](realtime.md#transporte)                    | ⬜     |
| Mocks ativados por configuração e disponíveis no build de demonstração         | `VITE_ENABLE_MOCKS`                                      | ⬜     |
| Mudanças refletidas em REST e eventos                                          | Barramento do banco simulado                             | ⬜     |

## §7 Tempo real

| Requisito                                                                 | Solução                                                                       | Spec   | Status |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------ | ------ |
| `nft.updated` em catálogo, detalhe e carrinho                             | Roteador de eventos                                                           | 09     | ⬜     |
| `order.updated` com confirmação/recusa                                    | Roteador de eventos                                                           | 06, 07 | ⬜     |
| Identidade, recurso e versão; duplicatas e antigos                        | LRU + versões                                                                 | 10     | ⬜     |
| Reconciliação após reconexão                                              | `connect` ⇒ invalidate                                                        | 10     | ⬜     |
| Eventos de sessão anterior não afetam outro usuário                       | `userId`/`sessionId` + reconexão                                              | 03, 10 | ⬜     |
| Listeners liberados no fim do ciclo de vida                               | Cleanup em hooks                                                              | 10     | ⬜     |
| Cenário carrinho → mudança → aviso → checkout bloqueado                   | [realtime.md](realtime.md#cenário-obrigatório-alteração-com-item-no-carrinho) | 09     | ⬜     |
| Queda com pedido pendente, recuperação sem nova compra; estados terminais | [realtime.md](realtime.md#cenário-obrigatório-queda-com-pedido-pendente)      | 10     | ⬜     |

## §8 Interface, responsividade e acessibilidade

| Requisito                                                                              | Solução                                                                                                | Spec   | Status |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------ | ------ |
| Fidelidade ao Figma; shadcn/ui adaptado                                                | Tokens ([ADR-0013](adr/0013-tailwind-v4-e-shadcn-com-tokens-do-figma.md))                              | visual | ⬜     |
| 390, 768, 1440 px                                                                      | Projetos Playwright                                                                                    | visual | ⬜     |
| Skeletons com shimmer (catálogo, detalhe, resumo do carrinho), sem CLS, reduced motion | `Skeleton`                                                                                             | 12     | ⬜     |
| Itens de acessibilidade obrigatórios                                                   | [accessibility.md](accessibility.md)                                                                   | 11     | ⬜     |
| Assets locais; substituições e ajustes documentados                                    | [ARCHITECTURE §7](../ARCHITECTURE.md#7-desvios-do-figma) (documentado); exportação dos assets pendente | —      | 🟡     |

## §9 Testes

| Requisito                                                             | Solução                                                           | Status |
| --------------------------------------------------------------------- | ----------------------------------------------------------------- | ------ |
| 12 grupos de cenários                                                 | [Matriz](testing.md#matriz-de-cobertura-exigida-pelo-enunciado-9) | ⬜     |
| Chromium desktop e mobile                                             | Projetos `desktop`/`mobile`                                       | ⬜     |
| Regressão visual (início, detalhe, carrinho, pagamento) com baselines | `__screenshots__/`                                                | ⬜     |
| Estado isolado; controle de relógio, latência e eventos               | Fixtures `mock`, `page.clock`                                     | ⬜     |
| Relatório HTML e traces de falha                                      | Config do Playwright                                              | ⬜     |
| Tempo real pelo cliente Socket.IO; REST pelos handlers MSW            | Sem stubs no cliente                                              | ⬜     |

## §10 Lighthouse

| Requisito                                                            | Solução                                    | Status |
| -------------------------------------------------------------------- | ------------------------------------------ | ------ |
| Início e detalhe, mobile e desktop, build otimizado, cenário padrão  | [performance.md](performance.md#protocolo) | ⬜     |
| Metas ≥ 90/95/95/90                                                  | Medidas planejadas                         | ⬜     |
| 3 medições, mediana, config versionada, HTML/JSON, versões, ambiente | `@lhci/cli` + `summarize.ts`               | ⬜     |
| LCP, CLS, TBT; justificar abaixo da meta                             | `summary.md`                               | ⬜     |
| Sem simplificações exclusivas para pontuação                         | Mesmo build do deploy                      | ⬜     |

## §12 Entrega

| Requisito                                                                        | Solução                                                               | Status                                            |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------- |
| Código, lockfile, assets, mocks, fixtures, testes, configs de auditoria          | Repositório                                                           | ⬜                                                |
| Deploy público com mocks e tempo real; acesso direto e refresh                   | [ADR-0016](adr/0016-deploy-vercel-com-mocks.md)                       | ⬜                                                |
| README: setup, env, credenciais, cenários e reset, comandos, fluxos de falha     | [README](../README.md)                                                | ✅ (documentado)                                  |
| Docs: contratos REST e eventos, sessão, carrinho, cache, reconciliação           | `docs/`                                                               | ✅ (documentado)                                  |
| `ARCHITECTURE.md`: limitações, decisões de UX, desvios do Figma                  | [ARCHITECTURE.md](../ARCHITECTURE.md), [docs/figma/](figma/README.md) | ✅ (documentado; revisar durante a implementação) |
| Comandos: dev com mocks, build, preview, typecheck, lint, Playwright, Lighthouse | [README §6](../README.md#6-comandos)                                  | ⬜ (implementar scripts)                          |
| Executa de checkout limpo, sem serviços privados                                 | —                                                                     | ⬜                                                |

## Fundação de engenharia (além do enunciado)

| Item                                                                                                               | Evidência                                                                                                      | Status               |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | -------------------- |
| Tokens DTCG → Tailwind `@theme` + catálogo (Style Dictionary)                                                      | `tokens/`, `pnpm tokens:build`, [ADR-0019](adr/0019-design-system-endemico-e-style-dictionary.md)              | ✅                   |
| Design system endêmico (Button, IconButton, Badge, EthAmount, QuantityStepper, Skeleton, Spinner, TextField, Icon) | `src/shared/ui/`                                                                                               | ✅                   |
| Storybook com autodocs, args, variações, `play` e axe                                                              | `pnpm storybook`, `pnpm test:stories`, [ADR-0020](adr/0020-storybook-como-documentacao-e-bancada-de-testes.md) | ✅                   |
| Teste de tela por componente                                                                                       | `pnpm test:visual` (44 baselines)                                                                              | ✅                   |
| Unitários (lib, hooks, componentes) com TDD                                                                        | `pnpm test:unit` (66 testes)                                                                                   | ✅                   |
| BDD (Gherkin pt-BR) com Playwright em 3 viewports                                                                  | `tests/e2e/features/`, `pnpm test:e2e`                                                                         | ✅ (smoke da Início) |
| ESLint estrito, Prettier, Husky, lint-staged, commitlint                                                           | [ADR-0022](adr/0022-qualidade-de-codigo-e-convencoes.md), [CONTRIBUTING](../CONTRIBUTING.md)                   | ✅                   |
