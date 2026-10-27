# Arquitetura

Documento exigido pela seção 12 do enunciado: registra arquitetura, **limitações**, **decisões de UX** e **desvios do Figma**. Os detalhes de cada assunto ficam em `docs/` e as decisões em [`docs/adr/`](docs/adr/README.md).

## 1. Princípios

1. **A API simulada é o servidor.** Regras de negócio (disponibilidade, cotação, cupom, idempotência, estado de pedidos, isolamento por usuário) vivem nos handlers MSW e no banco simulado. A UI nunca decide preço final, sucesso de pagamento ou estado de pedido ([ADR-0006](docs/adr/0006-msw-como-servidor-simulado.md)).
2. **Componentes, hooks e o cliente Axios não conhecem os mocks.** Não há respostas fictícias, flags de “modo demo” nem caminhos alternativos de negócio fora de `src/mocks/`. Uma regra de lint proíbe importar `src/mocks` fora de `src/main.tsx`.
3. **Contratos tipados de ponta a ponta.** Schemas Zod em `src/contracts/` são a fonte única dos tipos: os handlers MSW constroem respostas a partir deles e o cliente valida as respostas na fronteira de transporte ([ADR-0005](docs/adr/0005-contratos-zod-compartilhados.md)).
4. **Tempo real sempre por `socket.io-client`.** Eventos chegam pelo socket, nunca por chamada direta a setters, callbacks ou ao cache ([ADR-0008](docs/adr/0008-socket-io-via-msw-binding.md)).
5. **Estado do servidor no TanStack Query, estado de navegação na URL, estado efêmero no componente.** Não há store global de dados remotos.

## 2. Camadas

```
┌────────────────────────────────────────────────────────────────────┐
│ routes/ (TanStack Router)  search params validados, guards, loaders│
├────────────────────────────────────────────────────────────────────┤
│ features/<domínio>/  componentes · hooks · queries.ts · mutations  │
├────────────────────────────────────────────────────────────────────┤
│ shared/api      Axios + interceptors + parse Zod + ApiError        │
│ shared/realtime socket.io-client + dedupe/versão + roteador eventos│
│ shared/ui       shadcn/ui adaptado ao Figma                        │
│ shared/lib      money (bigint wei), format, idempotency, storage   │
├────────────────────────────────────────────────────────────────────┤
│ contracts/      schemas Zod e tipos (REST + eventos)               │
╞════════════════════════ fronteira de rede ═════════════════════════╡
│ mocks/  handlers REST · handler Socket.IO · db · cenários · seed   │
└────────────────────────────────────────────────────────────────────┘
```

### Estrutura de diretórios

```
src/
  main.tsx                 bootstrap: ativa MSW (se VITE_ENABLE_MOCKS) antes de montar
  app/                     QueryClient, RouterProvider, providers, error boundaries
  routes/                  rotas file-based (ver §3)
  features/
    catalog/  nft/  favorites/  cart/  checkout/  orders/
    auth/  profile/  wallets/
  shared/
    api/  realtime/  a11y/
    ui/                    design system endêmico (componente + variants + test + stories)
      primitives/          primitivas shadcn/ui (Radix) adaptadas aos tokens
    hooks/                 hooks reutilizáveis com testes isolados
    lib/                   money (bigint), cn (tailwind-merge ciente dos tokens)
    design-tokens/         catálogo gerado + dicionário no Storybook
  styles/                  index.css + generated/theme.css (@theme do Tailwind)
  contracts/               auth.ts nft.ts cart.ts quote.ts order.ts profile.ts wallet.ts events.ts errors.ts
  mocks/
    browser.ts             setupWorker(...handlers)
    db/                    banco em memória + persistência localStorage + seed
    fixtures/              NFTs, usuários, cupons, pedidos
    handlers/rest/         um arquivo por recurso
    handlers/socket.ts     servidor Socket.IO simulado (@mswjs/socket.io-binding)
    scenarios/             definição declarativa dos cenários
    control/               endpoints /__mock/* e painel
tokens/                    fonte DTCG (primitive/ e semantic/), compilada pelo Style Dictionary
.storybook/                configuração do Storybook (autodocs, a11y, vitest)
tests/e2e/                 features Gherkin (BDD), steps, __screenshots__
tests/visual/              captura por story do Storybook (gerada no container do Playwright)
lighthouse/                configs LHCI (mobile/desktop) e summarize.ts
scripts/                   playwright-docker.sh, check-playwright-image.mjs
.github/workflows/         CI: quality, tests, visual, e2e, lighthouse
lighthouse/                lighthouserc.mobile.cjs, lighthouserc.desktop.cjs, summarize.ts
docs/                      documentação e ADRs
```

## 3. Rotas

| Rota               | Tela                           | Acesso                             | Search params                                                             |
| ------------------ | ------------------------------ | ---------------------------------- | ------------------------------------------------------------------------- |
| `/`                | Início (destaques + catálogo)  | público                            | `q`, `tab`, `category`, `network`, `priceMin`, `priceMax`, `sort`, `page` |
| `/nfts/$nftId`     | Detalhes do NFT                | público                            | `edition`                                                                 |
| `/cart`            | Carrinho                       | público (visitante ou autenticado) | —                                                                         |
| `/checkout`        | Pagamento                      | autenticado                        | `step` (`details` \| `wallet` \| `review`)                                |
| `/orders/$orderId` | Confirmação / estado do pedido | autenticado, dono do pedido        | —                                                                         |
| `/login`           | Login                          | apenas não autenticado             | `redirect`, `reason`                                                      |
| `/register`        | Cadastro                       | apenas não autenticado             | `redirect`                                                                |
| `/account/profile` | Perfil do colecionador         | autenticado                        | —                                                                         |
| `/account/wallets` | Carteiras                      | autenticado                        | —                                                                         |
| `*`                | Não encontrado                 | público                            | —                                                                         |

Filtros, abas e ordenação seguem o Figma ([`docs/figma/screens.md`](docs/figma/screens.md)). Login e Cadastro são modais no layout, mas têm rota própria (acesso direto) e renderizam a Início ao fundo; a Confirmação também tem rota própria. Guards usam `beforeLoad` com `context.auth` ([ADR-0003](docs/adr/0003-tanstack-router-file-based.md)).

## 4. Fluxos de dados

| Assunto                                  | Documento                                          |
| ---------------------------------------- | -------------------------------------------------- |
| Contratos REST                           | [`docs/api-contracts.md`](docs/api-contracts.md)   |
| Eventos e reconciliação REST ↔ Socket.IO | [`docs/realtime.md`](docs/realtime.md)             |
| Sessão                                   | [`docs/session.md`](docs/session.md)               |
| Carrinho                                 | [`docs/cart.md`](docs/cart.md)                     |
| Pagamento e pedidos                      | [`docs/checkout.md`](docs/checkout.md)             |
| Cache, retries, sincronização            | [`docs/cache-strategy.md`](docs/cache-strategy.md) |

## 5. Decisões de UX

| Situação                                                                 | Decisão                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ações fora do escopo (editorial, suporte, atividade, ofertas, downloads) | Renderizadas como texto/botão com `aria-disabled="true"` e rótulo “Indisponível na demonstração” em tooltip; nunca exibem toast de sucesso nem navegam para página vazia. Links externos reais (redes sociais) abrem em nova aba com `rel="noopener noreferrer"` e indicação visual/textual. |
| Mudança de filtro                                                        | Reinicia `page` para 1, mantém scroll no topo da lista e mantém os resultados anteriores esmaecidos (`placeholderData`) com `aria-busy` até a nova resposta.                                                                                                                                 |
| Busca                                                                    | Debounce de 300 ms; a URL é atualizada com `replace` durante digitação e `push` ao confirmar (Enter), para o histórico não registrar cada tecla.                                                                                                                                             |
| Favoritar sem sessão                                                     | Redireciona ao login com `redirect` para o NFT; após autenticar, o usuário retorna e o favorito **não** é aplicado automaticamente (evita efeito implícito).                                                                                                                                 |
| Limite de quantidade                                                     | Stepper limitado por `min(disponível, maxPerOrder)`; o limite é explicado em texto, não apenas pelo botão desabilitado.                                                                                                                                                                      |
| Alteração em tempo real no carrinho                                      | Linha afetada destacada com ícone + texto (“Preço alterado: 0.80 → 0.95 ETH”), anúncio em região `aria-live="polite"` e resumo recalculado pela API.                                                                                                                                         |
| Cotação desatualizada no pagamento                                       | Botão de confirmação substituído por “Revisar alterações”; nova confirmação explícita exigida.                                                                                                                                                                                               |
| Pedido pendente                                                          | Tela do pedido com estado “Aguardando confirmação”, sem confetes ou recibo; recibo só para `confirmed`.                                                                                                                                                                                      |
| Pedido recusado                                                          | Mensagem com motivo simulado, itens mantidos no carrinho e ação “Voltar ao carrinho”.                                                                                                                                                                                                        |
| Sessão expirada                                                          | Toast + redirecionamento ao login com `reason=expired`; contexto do checkout preservado em `sessionStorage` (sem dados sensíveis).                                                                                                                                                           |
| Erros de API                                                             | 4xx de validação vão para os campos; 409 de disponibilidade vira mensagem na linha do item; 5xx/rede mostram erro de seção com “Tentar novamente”.                                                                                                                                           |

## 6. Limitações

| Limitação                                                   | Motivo                                                                                | Mitigação                                                                                                       |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Socket.IO apenas com transporte `websocket`                 | `@mswjs/socket.io-binding` intercepta WebSocket; long-polling não é suportado no mock | Cliente configurado com `transports: ['websocket']` em todos os ambientes                                       |
| “Servidor” vive na aba                                      | MSW executa handlers no contexto da página                                            | Eventos não se propagam entre abas; documentado, fora do escopo do enunciado                                    |
| Token de sessão em `localStorage`                           | Service Worker não emite cookies `HttpOnly`                                           | Token opaco, expiração curta, limpo no logout; ver [ADR-0010](docs/adr/0010-sessao-e-autenticacao-simuladas.md) |
| Hash de senha no navegador                                  | Não há backend                                                                        | PBKDF2 (Web Crypto) + salt; senha nunca persistida em claro                                                     |
| Primeiro carregamento depende do registro do Service Worker | MSW precisa estar ativo antes das requisições                                         | `main.tsx` aguarda `worker.start()` antes de montar; impacto medido no Lighthouse                               |
| Blockchain, extensões de carteira e gateways reais          | Fora do escopo do enunciado                                                           | Conexão, recusa e desconexão simuladas pela API                                                                 |
| Referências de transação e links de explorador              | Simulados                                                                             | Hash determinístico e link para rota simulada, marcado como “simulado”                                          |

## 7. Desvios do Figma

Fonte: extração do arquivo em 2026-10-27 ([`docs/figma/`](docs/figma/README.md)) e análise dos 62 comentários públicos ([`docs/figma/comments.md`](docs/figma/comments.md)). Atualizar durante a implementação.

| Tela / componente                 | Figma                                                                                               | Implementação                                                                                                                             | Motivo                                                     |
| --------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Geral                             | Espaçamentos, alinhamentos e raios pontualmente inconsistentes (59 estilos de texto, raios 2–40 px) | Escala consolidada de tipografia, espaçamento e raios ([design-tokens](docs/figma/design-tokens.md)); auto layout em todos os componentes | Coerência e manutenção; comentários #24–#57, #59–#61 e #65 |
| Geral                             | Line-heights menores que o tamanho da fonte (por exemplo, 18/16)                                    | Line-height ≥ 1.2                                                                                                                         | Legibilidade e zoom (WCAG 1.4.12)                          |
| Geral                             | Selos com texto de 9 px                                                                             | 11 px                                                                                                                                     | Legibilidade                                               |
| Header                            | Divisor só em algumas telas                                                                         | Mesmo header, com divisor, em todas                                                                                                       | Comentário #11                                             |
| Header                            | Botão “Entrar” fixo                                                                                 | Vira menu do usuário quando há sessão                                                                                                     | Comentário #14 e §3.4 do enunciado                         |
| Início / filtros                  | “Coleções” em ordem arbitrária, seleção pouco evidente                                              | Checkboxes em ordem alfabética, com estado visível                                                                                        | Filtros combináveis (§3.1); comentários #4 e #12           |
| Início / preço                    | Só slider                                                                                           | Slider sincronizado com campos mín./máx.                                                                                                  | Precisão e teclado; comentário #5                          |
| Início / filtros                  | Contagens fixas (soma de categorias ≠ soma de redes)                                                | Contagens facetadas calculadas pela API                                                                                                   | Coerência com os dados                                     |
| Início / grid                     | Cards com alturas 356/350/300 e coluna desalinhada                                                  | Cards de altura fixa, grid alinhado à sidebar                                                                                             | Comentários #60 e #61; evita CLS                           |
| Início / ordenação                | Só “Listados recentemente”                                                                          | + “Menor preço”, “Maior preço”, “Nome (A–Z)”                                                                                              | §3 exige ordenação; comentário #6                          |
| Início / paginação                | Sem “anterior”                                                                                      | “Anterior” a partir da página 2                                                                                                           | Comentário #7                                              |
| Benefícios                        | Letras “W”, “C”, “D” como ícones                                                                    | Ícones Iconly (Wallet, User, Bell)                                                                                                        | Significado; comentário #17                                |
| Detalhe / stepper                 | “−” ativo no mínimo; stepper diferente no mobile                                                    | “−” desabilitado no mínimo; um único componente                                                                                           | Comentários #10 e #15                                      |
| Carrinho mobile                   | Sem ação de remover (o desktop tem a lixeira)                                                       | Botão de remover também no card mobile                                                                                                    | §3 exige remoção; comentário #16                           |
| Carrinho / resumo                 | Desconto “(-) 00.00”                                                                                | Desconto em ETH (“0 ETH”)                                                                                                                 | Precisão em ETH (§3.2)                                     |
| Carrinho / pagamento              | “ID do token” diverge entre telas                                                                   | `tokenId` único por NFT                                                                                                                   | Comentário #21                                             |
| Pagamento mobile                  | Só seleção de carteira                                                                              | Mesmas etapas do desktop (dados → carteira → revisão)                                                                                     | §3 exige validar os dados; comentário #20                  |
| Pagamento / carteiras             | Campo ENS sempre visível                                                                            | ENS só com rede Ethereum                                                                                                                  | Comentário #18                                             |
| Carteiras                         | Formulário repete campos de perfil (e-mail, código de indicação)                                    | Só campos de carteira; dados de perfil ficam no Perfil                                                                                    | Responsabilidade única                                     |
| Confirmação                       | Modal sobre o pagamento, só estado “confirmado”                                                     | Rota `/orders/$orderId` com o mesmo cartão; estados pendente e recusado                                                                   | Acesso direto e refresh (§4, §12); comentário #19          |
| Login / Cadastro                  | Modal sem backdrop                                                                                  | Backdrop preto a 60 %, foco preso                                                                                                         | Foco e contraste; comentário #58                           |
| Login / Cadastro                  | Botões Google/Facebook e “Esqueceu a senha?”                                                        | Visíveis, com `aria-disabled` e “Indisponível na demonstração”                                                                            | Fora do escopo; não simular sucesso (§3)                   |
| Perfil / Carteiras mobile, tablet | Sem frames                                                                                          | Layout derivado (menu lateral vira navegação no topo)                                                                                     | §3 e §8                                                    |
| Mobile                            | Frames de 414 px                                                                                    | Validado em 390, 768 e 1440 px                                                                                                            | §8                                                         |
| Tema                              | Só escuro                                                                                           | Só escuro (`color-scheme: dark`)                                                                                                          | Fiel ao Figma; comentário #9                               |

### Substituição de assets

| Asset                           | Origem                                                                 | Substituto                                                                                | Motivo                                              |
| ------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Arte dos NFTs                   | 4 PNG de 1254 × 1254 (~2 MB cada)                                      | AVIF/WebP com `srcset` (258, 516 e 1032 px)                                               | Performance (LCP)                                   |
| Arte das fixtures extras        | Só 4 artes para 63 NFTs                                                | Variações derivadas das 4 artes (recorte, matiz e fundo)                                  | Variedade de fixtures para filtros e paginação (§6) |
| Fonte Roboto Mono               | Google Fonts                                                           | `woff2` local com subset latin                                                            | Execução offline e auditoria reprodutível           |
| Ícones                          | Iconly (20 componentes do arquivo)                                     | SVG exportados do Figma com `currentColor`, via SVGR; nomes corrigidos conforme o desenho | Herdar a cor dos tokens                             |
| Ícones ausentes como componente | Vetores soltos (busca, coração, +/−, compartilhar, zoom, e-mail, link) | `lucide-react` com o mesmo traço                                                          | Não existem como componentes exportáveis no arquivo |
| Letras W/C/D                    | Texto                                                                  | Ícones Iconly                                                                             | Comentário #17                                      |

Fontes e imagens são servidas localmente (`public/fonts`, `public/images`) para execução offline e auditoria reprodutível.

### Ajustes de acessibilidade em relação ao layout

Ver [`docs/accessibility.md`](docs/accessibility.md#ajustes-em-relação-ao-figma).
