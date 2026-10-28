# NFT Marketplace — Desafio Frontend

**Kurio**: implementação do [Desafio Frontend — Marketplace de NFTs](https://github.com/junglegaming/frontend-challenge) em React + TypeScript, seguindo o [layout no Figma](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1).

> **Status:** fundação pronta: tokens, design system com Storybook, testes unitários, de story, visuais e BDD, e pipeline de qualidade. As telas e a camada de dados estão em desenvolvimento. O que já foi entregue está marcado em [`docs/requirements-traceability.md`](docs/requirements-traceability.md).

|                                                            |                                      |
| ---------------------------------------------------------- | ------------------------------------ |
| Repositório                                                | _a definir_                          |
| Deploy público (Vercel)                                    | _a definir_                          |
| Arquitetura, limitações, decisões de UX e desvios do Figma | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| Decisões registradas                                       | [`docs/adr/`](docs/adr/README.md)    |

---

## 1. Stack

Todas as tecnologias obrigatórias do enunciado participam efetivamente da solução (ver [ADR índice](docs/adr/README.md)).

| Responsabilidade       | Tecnologia                       | Onde atua                                        |
| ---------------------- | -------------------------------- | ------------------------------------------------ |
| Interface              | React 19                         | `src/`                                           |
| Linguagem              | TypeScript (strict)              | todo o projeto                                   |
| Roteamento             | TanStack Router (file-based)     | `src/routes/`, search params, guards             |
| Estado remoto          | TanStack Query                   | `src/features/*/queries.ts`                      |
| Cliente HTTP           | Axios                            | `src/shared/api/client.ts`                       |
| Integração de dados    | REST                             | [`docs/api-contracts.md`](docs/api-contracts.md) |
| Tempo real             | Socket.IO (`socket.io-client`)   | `src/shared/realtime/`                           |
| Estilização            | Tailwind CSS v4                  | `src/styles/`                                    |
| Componentes            | shadcn/ui                        | `src/shared/ui/`                                 |
| Mocking                | MSW + `@mswjs/socket.io-binding` | `src/mocks/`                                     |
| E2E e regressão visual | Playwright                       | `tests/e2e/`                                     |
| Auditoria              | Lighthouse (via `@lhci/cli`)     | `lighthouse/`                                    |

Complementares (critério do candidato):

- **Build e linguagem:** Vite 8, pnpm 10, TypeScript 6 ([ADR-0023](docs/adr/0023-fixacao-de-versoes-typescript-6-e-msw-2.md)).
- **Dados e formulários:** Zod, React Hook Form.
- **Design system:** Style Dictionary (tokens DTCG), Storybook 10 (autodocs, a11y, testes de story).
- **Testes:** Vitest + Testing Library (unitários, hooks, componentes), playwright-bdd (BDD em Gherkin).
- **Qualidade:** ESLint, Prettier, Husky, lint-staged, commitlint.

## 2. Setup

Pré-requisitos: **Node.js 22+** e **pnpm 10** (`corepack enable`). Para os testes visuais: **Docker**.

```bash
git clone <repo> nft-marketplace && cd nft-marketplace
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env          # valores padrão já ativam os mocks
pnpm exec playwright install --with-deps chromium   # apenas para testes/auditoria
pnpm dev                      # http://localhost:5173
```

A entrega roda a partir de um checkout limpo, sem serviços privados nem backend de produção: toda API REST e todo evento Socket.IO são servidos pelo MSW no próprio navegador.

## 3. Variáveis de ambiente

Arquivo `.env.example` versionado. Todas são públicas (prefixo `VITE_`) — não há segredos.

| Variável                     | Padrão       | Descrição                                                                                                                                   |
| ---------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_ENABLE_MOCKS`          | `true`       | Ativa MSW (REST + Socket.IO). Também `true` no build de demonstração publicado.                                                             |
| `VITE_API_BASE_URL`          | `/api/v1`    | Base das chamadas REST feitas pelo Axios.                                                                                                   |
| `VITE_SOCKET_URL`            | _(vazio)_    | Origem do Socket.IO. Vazio = mesma origem da página (recomendado para dev, preview e deploy); com mocks, a conexão é interceptada pelo MSW. |
| `VITE_SOCKET_PATH`           | `/socket.io` | Path do Socket.IO.                                                                                                                          |
| `VITE_REQUEST_TIMEOUT_MS`    | `8000`       | Timeout do Axios. Usado nos cenários de timeout de pedido.                                                                                  |
| `VITE_MOCK_DEFAULT_SCENARIO` | `default`    | Cenário carregado quando nenhum outro foi selecionado.                                                                                      |
| `VITE_MOCK_PERSIST`          | `true`       | Persiste o banco simulado em `localStorage` para sobreviver a refresh.                                                                      |
| `VITE_MOCK_PANEL`            | `true`       | Exibe o painel de cenários (botão flutuante).                                                                                               |

## 4. Credenciais fictícias

Domínio `.test` (reservado, RFC 2606). Senhas são armazenadas no banco simulado apenas como hash PBKDF2 + salt ([ADR-0010](docs/adr/0010-sessao-e-autenticacao-simuladas.md)).

| Usuário                | E-mail               | Senha         | Particularidades                                                   |
| ---------------------- | -------------------- | ------------- | ------------------------------------------------------------------ |
| Ana (`ana.collector`)  | `ana@example.test`   | `Jungle#2026` | Carteiras principal e secundária, favoritos e um pedido confirmado |
| Bruno (`bruno.holder`) | `bruno@example.test` | `Jungle#2026` | Sem carteira secundária, carrinho vazio                            |
| —                      | `taken@example.test` | —             | E-mail já cadastrado para testar conflito no cadastro              |

Cupons: `JUNGLE10` (10 %, válido), `WELCOME5` (5 %, subtotal mínimo de 0.5 ETH), `EXPIRED20` (expirado), qualquer outro (inválido).

## 5. Cenários simulados

### 5.1 Seleção

Três formas equivalentes; todas passam pela camada de rede (endpoints de controle `/__mock/*` tratados pelo MSW):

1. **Query string:** `http://localhost:5173/?scenario=payment-declined` — aplica e remove o parâmetro da URL.
2. **Painel de cenários:** botão “Mock” no canto inferior (habilitado por `VITE_MOCK_PANEL`), com seletor, controles de latência e botão de reset.
3. **Playwright:** fixture `scenario` em `tests/e2e/fixtures.ts`.

O cenário ativo fica salvo em `localStorage` (`mock:scenario`) e sobrevive a refresh.

### 5.2 Reset

- `http://localhost:5173/?reset=1` — restaura o seed `default` integralmente (banco, sessão, carrinho de visitante, cenário).
- Painel → **Reset**.
- `POST /__mock/reset` (usado pelos testes).

### 5.3 Catálogo de cenários

Lista completa, determinística e com seed fixo em [`docs/mock-scenarios.md`](docs/mock-scenarios.md).

| ID                      | Efeito                                                                           |
| ----------------------- | -------------------------------------------------------------------------------- |
| `default`               | Sucesso, latência fixa de 150 ms                                                 |
| `empty-catalog`         | Listagem e destaques vazios                                                      |
| `slow-network`          | +2500 ms em todas as respostas (skeletons)                                       |
| `variable-latency`      | Latência pseudoaleatória 100–1800 ms (seed fixo)                                 |
| `out-of-order`          | Respostas de listagem retornam em ordem inversa à das requisições                |
| `offline`               | Erro de rede em todas as requisições e socket indisponível                       |
| `server-error`          | `503 TRANSIENT_FAILURE` nas 2 primeiras tentativas de cada GET, depois sucesso   |
| `http-errors`           | 500 permanente em listagem e detalhe                                             |
| `session-expired`       | Sessão expira na próxima requisição privada                                      |
| `unauthorized`          | `403 FORBIDDEN` em recursos privados                                             |
| `register-conflict`     | Cadastro sempre retorna `409 EMAIL_TAKEN`                                        |
| `form-validation`       | API retorna `422` com erros por campo em perfil, senha e carteiras               |
| `favorite-failure`      | Mutations de favorito retornam 500 (rollback otimista)                           |
| `price-change-checkout` | Ao entrar em pagamento, preço de um item do carrinho muda (REST + `nft.updated`) |
| `sold-out-checkout`     | Ao entrar em pagamento, edição de um item esgota (REST + `nft.updated`)          |
| `order-timeout`         | `POST /orders` cria o pedido e só responde após o timeout do Axios               |
| `payment-confirmed`     | Pedido pendente → confirmado após 3 s (`order.updated`)                          |
| `payment-declined`      | Pedido pendente → recusado após 3 s (`order.updated`)                            |
| `socket-drop-pending`   | Conexão Socket.IO cai com pedido pendente; confirmação ocorre durante a queda    |
| `duplicate-events`      | Todo evento é emitido duas vezes e um evento de versão antiga é reenviado        |
| `wallet-rejected`       | Conexão de carteira é recusada                                                   |
| `wallet-disconnect`     | Carteira desconecta durante a revisão                                            |

## 6. Comandos

| Comando                                        | O que faz                                                                                    |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `pnpm dev`                                     | Desenvolvimento com mocks (MSW)                                                              |
| `pnpm build`                                   | Tokens, typecheck e build otimizado (mocks incluídos quando `VITE_ENABLE_MOCKS=true`)        |
| `pnpm preview`                                 | Serve o build em `http://localhost:4173`                                                     |
| `pnpm typecheck`                               | `tsc -b` (app, configs e testes)                                                             |
| `pnpm lint` / `pnpm lint:fix`                  | ESLint estrito (tipos, hooks, a11y, Testing Library, TanStack, Storybook)                    |
| `pnpm format` / `pnpm format:check`            | Prettier (com ordenação de classes Tailwind)                                                 |
| `pnpm tokens:build`                            | Style Dictionary: `tokens/` → `@theme` do Tailwind + catálogo TS                             |
| `pnpm test`                                    | Vitest em modo watch (unitários, hooks e componentes)                                        |
| `pnpm test:unit`                               | Vitest uma vez (unitários, hooks e componentes)                                              |
| `pnpm test:coverage`                           | Unitários + stories com limites de cobertura (roda no `pre-push` e na CI)                    |
| `pnpm storybook` / `pnpm storybook:build`      | Storybook em `http://localhost:6006` / build estático                                        |
| `pnpm test:stories`                            | Todas as stories no Chromium: `play` + axe (Vitest browser)                                  |
| `pnpm test:visual` / `pnpm test:visual:update` | Captura por componente na imagem Docker oficial do Playwright / atualizar baselines          |
| `pnpm test:e2e:docker`                         | E2E/BDD dentro do container (para baselines de página)                                       |
| `pnpm test:e2e`                                | BDD/E2E: `bddgen` + Playwright em desktop (1440), tablet (768) e mobile (390) contra o build |
| `pnpm test:e2e:ui` / `pnpm test:e2e:report`    | Playwright UI / relatório HTML                                                               |
| `pnpm lighthouse`                              | Build + auditoria mobile e desktop (3 execuções por página) + `summary.md` com medianas      |
| `pnpm validate`                                | Typecheck, lint, formatação, versão da imagem do Playwright e `test:coverage`                |
| `pnpm msw:init`                                | Regenera `public/mockServiceWorker.js`                                                       |

Fluxo de trabalho, anatomia de componentes, TDD, BDD e commits: [`CONTRIBUTING.md`](CONTRIBUTING.md).

## 7. Reproduzindo os fluxos de falha

Antes de cada roteiro: `?reset=1`. Credencial padrão: `ana@example.test` / `Jungle#2026`.

| Fluxo                          | Passos                                                                               | Resultado esperado                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Carregamento lento             | `?scenario=slow-network`, abrir Início e um NFT                                      | Skeletons com shimmer sem deslocamento de layout; sem shimmer com `prefers-reduced-motion`                |
| Falha e nova tentativa         | `?scenario=server-error`, abrir Início                                               | Duas falhas tratadas por retry automático; com `http-errors`, mensagem de erro e botão “Tentar novamente” |
| Sem conexão                    | `?scenario=offline`                                                                  | Estado de erro de rede, indicador de tempo real offline; ao trocar para `default`, recuperação            |
| Respostas fora de ordem        | `?scenario=out-of-order`, digitar rapidamente na busca                               | Lista final corresponde ao último termo                                                                   |
| NFT inexistente                | `/nfts/nao-existe`                                                                   | Tela “NFT não encontrado” com volta ao catálogo                                                           |
| Sessão expirada                | Login, adicionar ao carrinho, ir ao pagamento, selecionar `session-expired`, avançar | Redireciona ao login com aviso; após login retorna ao pagamento com dados preservados                     |
| Conflito de cadastro           | Cadastro com `taken@example.test`                                                    | Erro associado ao campo e-mail                                                                            |
| Favorito com falha             | `?scenario=favorite-failure`, favoritar                                              | Ícone muda imediatamente, volta ao estado anterior e anuncia o erro                                       |
| Cupom inválido/expirado        | Carrinho → `EXPIRED20` / `XYZ`                                                       | Mensagens distintas no campo do cupom; resumo inalterado                                                  |
| Preço alterado no checkout     | Carrinho com item → `?scenario=price-change-checkout` → Pagamento                    | Aviso acessível da alteração, resumo atualizado, confirmação bloqueada até nova revisão                   |
| Edição esgotada                | Idem com `sold-out-checkout`                                                         | Item marcado indisponível, confirmação bloqueada                                                          |
| Timeout do pedido              | `?scenario=order-timeout`, confirmar compra                                          | Interface reenvia com a mesma chave de idempotência e recupera **o mesmo** pedido                         |
| Clique repetido                | Clicar várias vezes em “Confirmar compra”                                            | Um único pedido criado                                                                                    |
| Pagamento recusado             | `?scenario=payment-declined`, confirmar                                              | Estado “Recusado”, itens preservados no carrinho                                                          |
| Queda com pedido pendente      | `?scenario=socket-drop-pending`, confirmar, recarregar a página                      | Pedido pendente recuperado e reconciliado via REST, sem nova compra                                       |
| Eventos duplicados             | `?scenario=duplicate-events` com item no carrinho                                    | Efeitos aplicados uma vez; estado não regride                                                             |
| Carteira recusada/desconectada | `wallet-rejected` / `wallet-disconnect` no pagamento                                 | Mensagem de recusa; desconexão volta para a etapa de carteira                                             |

## 8. Testes

```bash
pnpm test:unit          # Vitest: lógica, hooks e componentes
pnpm test:stories       # Storybook: play + acessibilidade (axe) no Chromium
pnpm test:visual        # captura de tela por componente
pnpm test:e2e           # BDD/E2E em desktop, tablet e mobile
pnpm test:e2e:report    # relatório HTML; traces gravados em falhas
```

Os 12 grupos exigidos pelo enunciado viram funcionalidades BDD em `tests/e2e/features/` (Gherkin pt-BR). Componentes têm testes unitários, de story (interação + axe) e visuais. Estratégia, isolamento, controle de relógio e baselines: [`docs/testing.md`](docs/testing.md).

## 9. Lighthouse

```bash
pnpm build && pnpm lighthouse
```

Gera `docs/performance/reports/<data>/` com HTML/JSON de cada execução e `summary.md` com medianas, LCP, CLS, TBT, versões e ambiente. Metodologia e resultados: [`docs/performance.md`](docs/performance.md).

## 10. Deploy

Vercel, preset Vite, `VITE_ENABLE_MOCKS=true`. `vercel.json` reescreve qualquer rota para `index.html` (acesso direto e refresh), preservando `mockServiceWorker.js` e assets estáticos. Detalhes: [ADR-0016](docs/adr/0016-deploy-vercel-com-mocks.md).

## 11. Documentação

| Documento                                                                | Conteúdo                                                           |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| [`ARCHITECTURE.md`](ARCHITECTURE.md)                                     | Visão geral, camadas, limitações, decisões de UX, desvios do Figma |
| [`docs/api-contracts.md`](docs/api-contracts.md)                         | Contratos REST e envelope de erros                                 |
| [`docs/realtime.md`](docs/realtime.md)                                   | Eventos Socket.IO, transporte no mock, reconciliação com REST      |
| [`docs/session.md`](docs/session.md)                                     | Política de sessão, expiração, logout e troca de usuário           |
| [`docs/cart.md`](docs/cart.md)                                           | Estado do carrinho, visitante, merge, cotação e precisão em ETH    |
| [`docs/checkout.md`](docs/checkout.md)                                   | Máquina de estados do pagamento, idempotência e recuperação        |
| [`docs/cache-strategy.md`](docs/cache-strategy.md)                       | Query keys, cache, retries, invalidação e atualização otimista     |
| [`docs/mock-scenarios.md`](docs/mock-scenarios.md)                       | Banco simulado, fixtures, cenários e endpoints de controle         |
| [`docs/testing.md`](docs/testing.md)                                     | Playwright, isolamento, relógio, regressão visual                  |
| [`docs/performance.md`](docs/performance.md)                             | Protocolo e resultados Lighthouse                                  |
| [`docs/accessibility.md`](docs/accessibility.md)                         | Requisitos e ajustes de acessibilidade                             |
| [`docs/requirements-traceability.md`](docs/requirements-traceability.md) | Cada requisito do enunciado → implementação → teste                |
| [`CONTRIBUTING.md`](CONTRIBUTING.md)                                     | Anatomia de componentes, TDD, BDD, tokens e commits                |
| [`docs/figma/`](docs/figma/README.md)                                    | Inventário do Figma, design tokens, telas e comentários            |
| [`docs/adr/`](docs/adr/README.md)                                        | Architecture Decision Records                                      |
