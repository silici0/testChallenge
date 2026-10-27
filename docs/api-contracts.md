# Contratos REST

Base: `VITE_API_BASE_URL` (padrão `/api/v1`). JSON em UTF-8. Os schemas Zod correspondentes ficam em `src/contracts/` e são usados tanto pelos handlers MSW quanto pela validação de respostas no cliente ([ADR-0005](adr/0005-contratos-zod-compartilhados.md)).

## Convenções

| Item                  | Regra                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------- |
| Autenticação          | `Authorization: Bearer <token>` (token opaco emitido pelo login/cadastro)                   |
| Carrinho de visitante | `X-Guest-Cart-Id: <uuid>` quando não há sessão                                              |
| Idempotência          | `Idempotency-Key: <uuid v4>` obrigatório em `POST /orders`                                  |
| Valores em ETH        | String decimal, até 18 casas, sem notação científica: `"0.125"`. Regex `^\d+(\.\d{1,18})?$` |
| Quantidades           | Inteiros positivos                                                                          |
| Datas                 | ISO 8601 UTC                                                                                |
| Identificadores       | Strings opacas (`nft_…`, `ed_…`, `usr_…`, `ord_…`)                                          |
| Versão de recurso     | `version: number` monotônico em NFT, carrinho e pedido; usado também nos eventos            |
| Request id            | Toda resposta inclui `X-Request-Id`                                                         |

## Envelope de erro

```ts
type ApiErrorBody = {
  error: {
    code: ApiErrorCode
    message: string // texto para log; a UI usa mensagens próprias por code
    fieldErrors?: Record<string, string[]> // validação por campo
    details?: Record<string, unknown> // ex.: quote atualizada, disponível
    retryable: boolean
    requestId: string
  }
}
```

| HTTP | `code`                           | Significado                                                    | Retry automático                                |
| ---- | -------------------------------- | -------------------------------------------------------------- | ----------------------------------------------- |
| 400  | `BAD_REQUEST`                    | Corpo/parâmetro malformado                                     | não                                             |
| 401  | `UNAUTHENTICATED`                | Sem token ou token desconhecido                                | não                                             |
| 401  | `SESSION_EXPIRED`                | Token expirado                                                 | não                                             |
| 401  | `INVALID_CREDENTIALS`            | Login inválido                                                 | não                                             |
| 403  | `FORBIDDEN`                      | Recurso de outro usuário / sem permissão                       | não                                             |
| 404  | `NOT_FOUND`                      | Recurso inexistente                                            | não                                             |
| 409  | `EMAIL_TAKEN` / `USERNAME_TAKEN` | Conflito no cadastro/perfil                                    | não                                             |
| 409  | `AVAILABILITY_CONFLICT`          | Quantidade acima do disponível; `details.available`            | não                                             |
| 409  | `QUOTE_STALE`                    | Cotação divergente; `details.quote` (nova) e `details.changes` | não                                             |
| 409  | `IDEMPOTENCY_CONFLICT`           | Mesma chave com corpo diferente                                | não                                             |
| 422  | `VALIDATION_ERROR`               | Campos inválidos; `fieldErrors`                                | não                                             |
| 422  | `COUPON_INVALID`                 | Cupom inexistente                                              | não                                             |
| 422  | `COUPON_EXPIRED`                 | Cupom expirado                                                 | não                                             |
| 422  | `WALLET_REJECTED`                | Conexão de carteira recusada                                   | não                                             |
| 429  | `RATE_LIMITED`                   | Excesso de requisições                                         | sim, respeitando `Retry-After`                  |
| 500  | `INTERNAL_ERROR`                 | Erro do servidor                                               | GET: sim                                        |
| 503  | `TRANSIENT_FAILURE`              | Indisponibilidade temporária                                   | GET: sim                                        |
| —    | `NETWORK_ERROR` / `TIMEOUT`      | Gerados pelo cliente (Axios)                                   | GET: sim; `POST /orders`: sim com a mesma chave |

---

## Sessão e conta

### `POST /auth/register`

```json
{
  "username": "ana.collector",
  "email": "ana@example.test",
  "password": "Jungle#2026",
  "confirmPassword": "Jungle#2026",
  "guestCartId": "uuid?"
}
```

Campos do frame “Cadastro”: Nome de usuário, E-mail, Senha, Confirmar senha. `201` → `AuthResponse`. Erros: `422 VALIDATION_ERROR`, `409 EMAIL_TAKEN | USERNAME_TAKEN`.

### `POST /auth/login`

```json
{ "email": "ana@example.test", "password": "Jungle#2026", "guestCartId": "uuid?" }
```

`200` → `AuthResponse`. Se `guestCartId` for enviado, o servidor mescla o carrinho do visitante no do usuário ([cart.md](cart.md#merge-ao-autenticar)). Erros: `401 INVALID_CREDENTIALS`, `422`.

```ts
type AuthResponse = {
  user: { id: string; displayName: string; username: string; email: string; avatarUrl: string | null }
  session: { token: string; expiresAt: string }
}
```

### `GET /auth/session`

`200` → `AuthResponse` (renova `expiresAt`, sliding). `401 UNAUTHENTICATED | SESSION_EXPIRED`.

### `POST /auth/logout`

`204`. Invalida o token no servidor simulado. Idempotente.

### Expiração

Tokens expiram após 30 min sem uso (sliding). Qualquer endpoint privado pode responder `401 SESSION_EXPIRED`. O cenário `session-expired` força a expiração na próxima requisição privada.

## NFTs

### `GET /nfts`

| Param                  | Tipo                                                               | Notas                                                                                                                                                         |
| ---------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `q`                    | string                                                             | Busca em nome, coleção e criador (case/acento-insensível)                                                                                                     |
| `tab`                  | `all` \| `new` \| `trending`                                       | Abas “Todos os NFTs · Novos lançamentos · Em alta”. Padrão `all`                                                                                              |
| `category`             | string[] (repetido)                                                | Filtro “Coleções” do Figma: `arte-digital`, `fotografia`, `musica`, `arte-3d`, `colecionaveis`, `generativa`, `jogos`, `assinaturas`, `utilidade`. Combinável |
| `network`              | (`ethereum` \| `polygon` \| `solana`)[]                            | Filtro “Rede”. Combinável                                                                                                                                     |
| `collection`           | string                                                             | Usado em “Mais desta coleção” (não é exposto como filtro na UI)                                                                                               |
| `priceMin`, `priceMax` | decimal string                                                     | “Faixa de preço”; filtra pelo menor preço entre as edições                                                                                                    |
| `sort`                 | `recent` \| `price-asc` \| `price-desc` \| `name-asc` \| `popular` | Padrão `recent` (“Listados recentemente”)                                                                                                                     |
| `page`                 | int ≥ 1                                                            | Padrão 1                                                                                                                                                      |
| `pageSize`             | int 1–48                                                           | Padrão 9 (grid 3 × 3 do Figma)                                                                                                                                |

Ordenação estável: empate desempatado por `id`.

```ts
type NftListResponse = {
  items: NftSummary[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  appliedFilters: NftListParams // eco dos parâmetros normalizados
}
type NftSummary = {
  id: string
  name: string
  collection: { id: string; name: string }
  creator: { id: string; name: string; avatarUrl: string }
  image: { url: string; alt: string; width: number; height: number }
  category: string
  network: 'ethereum' | 'polygon' | 'solana'
  badge: 'rare' | null // selo “RARO”
  priceFromEth: string
  available: number
  version: number
}
```

`appliedFilters` permite ao cliente descartar respostas que não correspondem aos parâmetros vigentes.

### `GET /nfts/featured`

`200` → `{ items: NftSummary[] }` (destaques da Início).

### `GET /nfts/facets`

`200` → `{ categories: Facet[]; networks: Facet[]; priceRange: { minEth: string; maxEth: string } }`, com `Facet = { id: string; label: string; count: number }`. Aceita os mesmos parâmetros de `GET /nfts`; as contagens de cada grupo consideram os filtros dos **outros** grupos (contagem facetada). Categorias vêm em ordem alfabética.

### `GET /nfts/:nftId`

```ts
type NftDetail = NftSummary & {
  tokenId: string // "#0042"
  description: string
  longDescription: string
  gallery: { url: string; alt: string; width: number; height: number }[] // vistas da mesma obra
  attributes: { trait: string; value: string }[]
  rating: { average: number; count: number }
  reviews: { author: string; rating: number; text: string; createdAt: string }[]
  contract: { address: string; standard: 'ERC-721' | 'ERC-1155' | 'SPL' }
  royaltyPercent: number
  editions: Edition[]
  createdAt: string
}
type Edition = {
  id: string
  label: string // "1/1", "1/10", "1/50", "Aberta"
  priceEth: string
  supply: number | null // null = edição aberta
  available: number
  maxPerOrder: number
  status: 'available' | 'sold-out' | 'unavailable'
}
```

`404 NOT_FOUND` para NFT inexistente.

## Favoritos (autenticado)

| Método   | Rota                   | Resposta                                    |
| -------- | ---------------------- | ------------------------------------------- |
| `GET`    | `/me/favorites`        | `{ nftIds: string[]; items: NftSummary[] }` |
| `PUT`    | `/me/favorites/:nftId` | `204` (idempotente)                         |
| `DELETE` | `/me/favorites/:nftId` | `204` (idempotente)                         |

`404` se o NFT não existe.

## Carrinho

Autenticado: carrinho do usuário. Visitante: carrinho identificado por `X-Guest-Cart-Id` (criado sob demanda).

```ts
type Cart = {
  id: string
  ownerType: 'guest' | 'user'
  version: number
  items: CartItem[]
  couponCode: string | null
  summary: QuoteSummary // calculado pelo servidor
  issues: CartIssue[] // preço alterado, indisponível, quantidade reduzida
}
type CartItem = {
  id: string
  nftId: string
  editionId: string
  nft: Pick<NftSummary, 'id' | 'name' | 'image' | 'collection'> & { tokenId: string }
  editionLabel: string
  quantity: number
  unitPriceEth: string
  lineTotalEth: string
  available: number
  maxPerOrder: number
}
type CartIssue =
  | { type: 'PRICE_CHANGED'; itemId: string; previousEth: string; currentEth: string }
  | { type: 'QUANTITY_REDUCED'; itemId: string; requested: number; available: number }
  | { type: 'SOLD_OUT'; itemId: string }
```

| Método   | Rota                  | Corpo                            | Resposta | Erros                                     |
| -------- | --------------------- | -------------------------------- | -------- | ----------------------------------------- |
| `GET`    | `/cart`               | —                                | `Cart`   | —                                         |
| `POST`   | `/cart/items`         | `{ nftId, editionId, quantity }` | `Cart`   | `404`, `409 AVAILABILITY_CONFLICT`, `422` |
| `PATCH`  | `/cart/items/:itemId` | `{ quantity }`                   | `Cart`   | `404`, `409`, `422`                       |
| `DELETE` | `/cart/items/:itemId` | —                                | `Cart`   | `404`                                     |
| `PUT`    | `/cart/coupon`        | `{ code }`                       | `Cart`   | `422 COUPON_INVALID \| COUPON_EXPIRED`    |
| `DELETE` | `/cart/coupon`        | —                                | `Cart`   | —                                         |

Adicionar um item já presente (mesmo `nftId` + `editionId`) soma a quantidade, limitada por `available` e `maxPerOrder`.

## Cotação

### `POST /quotes` (autenticado)

```json
{ "network": "ethereum" }
```

Gera a cotação do carrinho atual: valida cupom, disponibilidade e preços, calcula taxas.

```ts
type QuoteSummary = {
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
  coupon: { code: string; status: 'applied' | 'invalid' | 'expired'; description: string } | null
}
type Quote = QuoteSummary & {
  id: string
  cartVersion: number
  network: 'ethereum' | 'polygon' | 'solana'
  items: {
    itemId: string
    nftId: string
    editionId: string
    quantity: number
    unitPriceEth: string
    lineTotalEth: string
  }[]
  issues: CartIssue[]
  expiresAt: string // 2 min
}
```

Uma cotação com `issues.length > 0` não pode ser usada para criar pedido.

## Pedidos (autenticado)

### `POST /orders`

Headers: `Idempotency-Key` (obrigatório).

```json
{
  "quoteId": "qt_…",
  "walletId": "wal_…",
  "network": "ethereum",
  "buyer": { "displayName": "…", "username": "…", "email": "…", "referralCode": null, "note": null }
}
```

| Situação                                                             | Resposta                                                  |
| -------------------------------------------------------------------- | --------------------------------------------------------- |
| Primeira tentativa válida                                            | `201` → `Order` (`status: "pending"`)                     |
| Mesma chave, mesmo corpo                                             | `200` → mesmo `Order` (estado atual)                      |
| Mesma chave, corpo diferente                                         | `409 IDEMPOTENCY_CONFLICT`                                |
| Cotação expirada ou divergente (preço, disponibilidade, cupom, taxa) | `409 QUOTE_STALE` com `details.quote` e `details.changes` |
| Carteira não conectada / de outro usuário                            | `422` / `403`                                             |

Comparação de corpo: hash canônico (chaves ordenadas) do JSON.

### `GET /orders/:orderId`

`200` → `Order`; `404` se inexistente; `403` se de outro usuário.

### `GET /orders?status=pending`

`200` → `{ items: Order[] }` — usado para recuperar pedido pendente após refresh/reconexão.

```ts
type Order = {
  id: string
  version: number
  status: 'pending' | 'confirmed' | 'declined' // confirmed/declined são terminais
  createdAt: string
  updatedAt: string
  declineReason: string | null
  receipt: {
    // snapshot imutável da cotação aceita
    items: {
      nftId: string
      name: string
      editionLabel: string
      image: Image
      quantity: number
      unitPriceEth: string
      lineTotalEth: string
    }[]
    subtotalEth: string
    discountEth: string
    networkFeeEth: string
    totalEth: string
    coupon: string | null
    network: string
    walletAddress: string
  }
  transaction: { hash: string; explorerUrl: string; simulated: true } | null // só quando confirmed
}
```

Ao confirmar, o servidor remove do carrinho **apenas** as quantidades compradas.

## Perfil (autenticado)

| Método   | Rota           | Corpo                                                                | Resposta  | Erros                                                  |
| -------- | -------------- | -------------------------------------------------------------------- | --------- | ------------------------------------------------------ |
| `GET`    | `/me/profile`  | —                                                                    | `Profile` | —                                                      |
| `PATCH`  | `/me/profile`  | `Partial<{ displayName, username, email, ensName, walletNickname }>` | `Profile` | `422`, `409 EMAIL_TAKEN \| USERNAME_TAKEN`             |
| `PUT`    | `/me/avatar`   | `multipart/form-data` (`file`, PNG/JPEG/WebP ≤ 2 MB)                 | `Profile` | `422`                                                  |
| `DELETE` | `/me/avatar`   | —                                                                    | `Profile` | —                                                      |
| `POST`   | `/me/password` | `{ currentPassword, newPassword }`                                   | `204`     | `422` (`currentPassword` incorreta vira `fieldErrors`) |

```ts
type Profile = {
  id: string
  displayName: string
  username: string
  email: string
  ensName: string | null // sem o sufixo ".eth"
  walletNickname: string | null
  avatarUrl: string | null
  version: number
}
```

Política de senha: mínimo 8 caracteres, letra maiúscula, minúscula, número e símbolo (validada no cliente e na API).

## Carteiras (autenticado)

```ts
type Wallet = {
  id: string
  role: 'primary' | 'secondary'
  displayName: string // “Nome de exibição” (obrigatório)
  nickname: string | null // “Apelido da carteira”
  network: 'ethereum' | 'polygon' | 'solana'
  address: string // EVM: 0x + 40 hex · Solana: base58, 32–44 caracteres
  provider: 'metamask' | 'walletconnect' | 'coinbase' // “Tipo de carteira”
  ensName: string | null // apenas network = ethereum
  connection: 'disconnected' | 'connected'
  version: number
}
```

| Método  | Rota                               | Corpo                                                                     | Resposta              | Erros                           |
| ------- | ---------------------------------- | ------------------------------------------------------------------------- | --------------------- | ------------------------------- |
| `GET`   | `/me/wallets`                      | —                                                                         | `{ items: Wallet[] }` | —                               |
| `POST`  | `/me/wallets`                      | `{ role, displayName, nickname, network, address, provider, ensName }`    | `201 Wallet`          | `422`, `409` (papel já ocupado) |
| `PATCH` | `/me/wallets/:walletId`            | `Partial<{ displayName, nickname, network, address, provider, ensName }>` | `Wallet`              | `422`, `404`, `403`             |
| `POST`  | `/me/wallets/:walletId/connect`    | `{ network }`                                                             | `Wallet`              | `422 WALLET_REJECTED`           |
| `POST`  | `/me/wallets/:walletId/disconnect` | —                                                                         | `Wallet`              | —                               |

No máximo uma carteira por papel. Desconexão iniciada pelo “servidor” chega via evento `wallet.updated` ([realtime.md](realtime.md)).

## Controle dos mocks (somente com `VITE_ENABLE_MOCKS`)

Tratados pelo MSW; não fazem parte da API de negócio. Detalhes em [mock-scenarios.md](mock-scenarios.md#endpoints-de-controle).

| Método        | Rota                                                                        |
| ------------- | --------------------------------------------------------------------------- |
| `GET` / `PUT` | `/__mock/scenario`                                                          |
| `POST`        | `/__mock/reset`                                                             |
| `PUT`         | `/__mock/network` (latência, falhas)                                        |
| `POST`        | `/__mock/nfts/:nftId` (altera preço/disponibilidade e emite `nft.updated`)  |
| `POST`        | `/__mock/orders/:orderId/resolve` (confirma/recusa e emite `order.updated`) |
| `POST`        | `/__mock/socket/drop` · `/__mock/socket/restore`                            |
