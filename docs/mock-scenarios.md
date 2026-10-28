# Mocking com MSW: banco, fixtures e cenários

Decisões: [ADR-0006](adr/0006-msw-como-servidor-simulado.md), [ADR-0007](adr/0007-cenarios-deterministicos.md), [ADR-0008](adr/0008-socket-io-via-msw-binding.md).

## Ativação

`src/main.tsx`:

```ts
if (import.meta.env.VITE_ENABLE_MOCKS === 'true') {
  const { startMocks } = await import('./mocks/browser')
  await startMocks() // worker.start({ onUnhandledRequest: 'error' em dev/test, 'bypass' em demo })
}
```

Import dinâmico: o código dos mocks só entra no bundle quando a flag está ativa (inclusive no build de demonstração). Nenhum outro módulo importa `src/mocks` (regra ESLint `no-restricted-imports`).

## Banco simulado (`src/mocks/db/`)

- Coleções: `users`, `sessions`, `nfts`, `editions`, `favorites`, `carts`, `coupons`, `quotes`, `orders`, `idempotencyKeys`, `profiles`, `wallets`, `events` (sequência de `eventId`/versões).
- Toda escrita passa por funções de domínio (`db.cart.addItem`, `db.nfts.updateEdition`, `db.orders.create`…), que aplicam as regras de negócio e **publicam a mudança** num barramento interno do mock. O handler Socket.IO assina esse barramento: a mesma mudança aparece no REST e no evento.
- Persistência: snapshot JSON em `localStorage["mock:db:v1"]` após cada escrita (`VITE_MOCK_PERSIST`). Versão do schema no nome da chave; incompatível ⇒ reseed.
- Reset: substitui o snapshot pelo seed do cenário e reinicia sequências, relógio lógico e PRNG — restauração integral de um estado conhecido.

## Fixtures (`src/mocks/fixtures/`)

| Fixture   | Conteúdo                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFTs      | 63 NFTs (7 páginas de 9), nomes no padrão do Figma (“Emerald Ape #042”, “Cosmic Bloom #118”…), as 9 categorias e as 3 redes do Figma, várias coleções (“Kurio Apes”…), preços de `0.02` a `12.30` ETH (faixa do Figma) com casas decimais variadas, edições `1/1`, `1/10`, `1/50` e aberta, incluindo edições esgotadas, `maxPerOrder` variados, um NFT totalmente esgotado e selos “RARO”. As contagens dos filtros são calculadas a partir das fixtures, não copiadas do layout |
| Destaques | 6 NFTs                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Usuários  | `ana@example.test`, `bruno@example.test`, `taken@example.test` (senhas pré-hasheadas no seed)                                                                                                                                                                                                                                                                                                                                                                                     |
| Carteiras | Ana: principal (Ethereum, MetaMask, ENS `ana.kurio.eth`) e secundária (Polygon, WalletConnect); Bruno: só principal                                                                                                                                                                                                                                                                                                                                                               |
| Cupons    | `JUNGLE10` (10 %), `WELCOME5` (5 %, mínimo 0.5 ETH), `EXPIRED20` (expirado)                                                                                                                                                                                                                                                                                                                                                                                                       |
| Pedidos   | Ana: um pedido `confirmed` histórico                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Imagens   | As 4 artes do Figma em `public/images/nfts/` (AVIF/WebP, `width`/`height` reais) mais variações derivadas para as 63 fixtures                                                                                                                                                                                                                                                                                                                                                     |

IDs e datas são fixos; não há `Math.random()` nem `Date.now()` sem passar pelo relógio/PRNG do mock.

## Cenários (`src/mocks/scenarios/`)

Cada cenário é declarativo:

```ts
type Scenario = {
  id: ScenarioId
  description: string
  seed?: (db: Db) => void // ajustes de dados sobre o seed default
  network?: { latencyMs?: number | [min, max]; offline?: boolean }
  rules?: ScenarioRule[] // ex.: { match: 'POST /orders', effect: 'delay-past-timeout' }
  events?: ScenarioEventRule[] // ex.: { on: 'order.created', resolve: 'declined', afterMs: 3000 }
}
```

| ID                      | Dados    | Rede                       | Regras                                                                                     |
| ----------------------- | -------- | -------------------------- | ------------------------------------------------------------------------------------------ |
| `default`               | seed     | 150 ms                     | pedidos confirmam em 3 s                                                                   |
| `empty-catalog`         | sem NFTs | 150 ms                     | —                                                                                          |
| `slow-network`          | seed     | 2500 ms                    | —                                                                                          |
| `variable-latency`      | seed     | 100–1800 ms (PRNG seed 42) | —                                                                                          |
| `out-of-order`          | seed     | —                          | `GET /nfts`: latência decrescente por requisição (1ª 1500 ms, 2ª 900 ms, 3ª 300 ms…)       |
| `offline`               | seed     | offline                    | `HttpResponse.error()` em tudo; handshake do socket recusado                               |
| `server-error`          | seed     | 150 ms                     | GETs: 503 nas 2 primeiras tentativas por URL                                               |
| `http-errors`           | seed     | 150 ms                     | `GET /nfts*`: 500 permanente; `GET /cart`: 404 com `NOT_FOUND`                             |
| `session-expired`       | seed     | 150 ms                     | próxima requisição privada ⇒ `401 SESSION_EXPIRED` (uma vez)                               |
| `unauthorized`          | seed     | 150 ms                     | recursos privados ⇒ `403 FORBIDDEN`                                                        |
| `register-conflict`     | seed     | 150 ms                     | `POST /auth/register` ⇒ `409 EMAIL_TAKEN`                                                  |
| `form-validation`       | seed     | 150 ms                     | `PATCH /me/profile`, `POST /me/password`, `POST/PATCH /me/wallets` ⇒ 422 com `fieldErrors` |
| `favorite-failure`      | seed     | 150 ms                     | `PUT/DELETE /me/favorites/*` ⇒ 500                                                         |
| `price-change-checkout` | seed     | 150 ms                     | 1ª `POST /quotes` ⇒ após resposta, preço do 1º item +15 % e `nft.updated`                  |
| `sold-out-checkout`     | seed     | 150 ms                     | idem, edição do 1º item ⇒ `available: 0`                                                   |
| `order-timeout`         | seed     | 150 ms                     | 1ª `POST /orders` cria o pedido e responde após `VITE_REQUEST_TIMEOUT_MS + 2000`           |
| `payment-confirmed`     | seed     | 150 ms                     | pedido ⇒ `confirmed` após 3 s                                                              |
| `payment-declined`      | seed     | 150 ms                     | pedido ⇒ `declined` (“Saldo insuficiente (simulado)”) após 3 s                             |
| `socket-drop-pending`   | seed     | 150 ms                     | após criar pedido: derruba socket, confirma em 2 s, restaura em 5 s                        |
| `duplicate-events`      | seed     | 150 ms                     | todo evento emitido 2×; reenvia evento com `version - 1` após 500 ms                       |
| `wallet-rejected`       | seed     | 150 ms                     | `POST /me/wallets/*/connect` ⇒ `422 WALLET_REJECTED`                                       |
| `wallet-disconnect`     | seed     | 150 ms                     | 2 s após conectar ⇒ `wallet.updated { connection: 'disconnected' }`                        |

Implementação: `src/mocks/scenarios/catalog.ts` (definições) e `src/mocks/scenarios/runtime.ts` (cenário ativo, contadores por rota, latência determinística e gatilhos únicos).

## Endpoints de controle

Tratados pelo MSW, ativos apenas com mocks. Usados pelo painel e pelos testes Playwright — a UI de negócio nunca os chama.

| Método | Rota                               | Corpo                                            | Efeito                                         |
| ------ | ---------------------------------- | ------------------------------------------------ | ---------------------------------------------- |
| `GET`  | `/__mock/scenario`                 | —                                                | Cenário ativo                                  |
| `PUT`  | `/__mock/scenario`                 | `{ id, reset?: boolean }`                        | Ativa cenário (opcionalmente reseedando)       |
| `POST` | `/__mock/reset`                    | `{ scenario?: ScenarioId }`                      | Reset integral                                 |
| `POST` | `/__mock/nfts/:nftId`              | `{ editionId, priceEth?, available? }`           | Altera dados e emite `nft.updated`             |
| `POST` | `/__mock/orders/:orderId/resolve`  | `{ status: 'confirmed' \| 'declined', reason? }` | Resolve pedido e emite `order.updated`         |
| `POST` | `/__mock/events/replay`            | `{ resource: 'nft:<id>' \| 'order:<id>' }`       | Reenvia o último evento do recurso (duplicata) |
| `POST` | `/__mock/socket/drop` · `/restore` | —                                                | Derruba / restaura conexões                    |

## Simulação de rede

| Condição                     | Implementação                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| Lentidão / latência variável | `await delay(ms)` do MSW com PRNG determinístico (mulberry32, seed por cenário)                  |
| Timeout                      | Atraso maior que `VITE_REQUEST_TIMEOUT_MS`; Axios aborta com `ECONNABORTED` → `ApiError TIMEOUT` |
| Sem conexão                  | `HttpResponse.error()` → `NETWORK_ERROR`; socket recusa handshake                                |
| HTTP 4xx/5xx                 | Envelope de erro padrão ([api-contracts.md](api-contracts.md#envelope-de-erro))                  |

Timers do mock rodam no contexto da página, portanto `page.clock` do Playwright controla latências e resoluções de pedido nos testes.
