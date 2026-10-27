# Tempo real (Socket.IO) e reconciliação com REST

## Transporte

| Item          | Valor                                                                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cliente       | `socket.io-client` v4, instância única em `src/shared/realtime/socket.ts`                                                                                  |
| Opções        | `transports: ['websocket']`, `autoConnect: false`, `reconnection: true`, backoff 500 ms → 5 s com jitter                                                   |
| Autenticação  | Token da sessão enviado no handshake (`auth: { token }`); fallback por query string se o binding não expuser o pacote `CONNECT` (validar na implementação) |
| Mock          | `ws.link()` do MSW + [`@mswjs/socket.io-binding`](https://github.com/mswjs/socket.io-binding) em `src/mocks/handlers/socket.ts`                            |
| Ciclo de vida | Conecta quando o app monta; reconecta com novo token ao trocar de sessão; `disconnect()` + remoção de listeners no logout                                  |

### Limitações no ambiente de mocks

- Apenas WebSocket: o binding não implementa long-polling. Em produção real o fallback poderia ser reativado.
- O “servidor” roda na mesma aba (contexto da página). Não há fan-out entre abas ou dispositivos.
- Salas (`rooms`) são implementadas manualmente no handler: o mock guarda, por conexão, o `userId` autenticado e os NFTs assinados.
- Queda de conexão é simulada pelo handler fechando o socket (`/__mock/socket/drop`) e recusando novas conexões até `/__mock/socket/restore`; o cenário `offline` também bloqueia o handshake.
- Acks do Socket.IO não são usados nos contratos para não depender de suporte parcial do binding.

## Envelope dos eventos

```ts
type RealtimeEvent<TType extends string, TData> = {
  eventId: string // único e estável (ex.: "evt_000123"); duplicatas reutilizam o mesmo id
  type: TType
  resource: { type: 'nft' | 'order' | 'wallet'; id: string }
  version: number // mesma versão do recurso na API REST
  occurredAt: string
  userId: string | null // null para eventos públicos
  sessionId: string | null // sessão que originou a assinatura privada
  data: TData
}
```

Schemas Zod em `src/contracts/events.ts`. Evento que falha no parse é descartado e registrado em `console.warn` (apenas em dev).

## Eventos

| Evento           | Escopo                                            | `data`                                                                         | Efeito no cliente                                                                                                                                                                     |
| ---------------- | ------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nft.updated`    | público (sala `nft:<id>` + broadcast de catálogo) | `{ editions: { id, priceEth, available, status }[], priceFromEth, available }` | Atualiza `['nfts','detail',id]` e itens das listas em cache via `setQueryData` **se a versão for maior**; invalida `cart` e `quote` se o NFT estiver no carrinho; anuncia a alteração |
| `order.updated`  | privado (sala `user:<id>`)                        | `{ status, declineReason, transaction }`                                       | Atualiza `['user',uid,'orders',id]`; em `confirmed`/`declined` invalida carrinho e navega/anuncia conforme a tela atual                                                               |
| `wallet.updated` | privado                                           | `{ connection }`                                                               | Atualiza carteiras; desconexão durante a revisão volta à etapa de carteira (extra, cenário `wallet-disconnect`)                                                                       |

Assinaturas do cliente:

| Emitido pelo cliente                             | Quando                                                               |
| ------------------------------------------------ | -------------------------------------------------------------------- |
| `nft.subscribe` / `nft.unsubscribe` `{ nftIds }` | Ao montar/desmontar detalhe e carrinho (o catálogo recebe broadcast) |

## Garantias no cliente (`src/shared/realtime/`)

1. **Dedupe:** LRU com os últimos 500 `eventId`; evento repetido é ignorado antes de qualquer efeito.
2. **Versão monotônica:** mapa `resource.type:id → version`. Evento com `version <= atual` é descartado. A versão atual também é atualizada por respostas REST (o maior entre REST e evento vence), então um evento antigo não regride dados vindos da API.
3. **Efeitos únicos:** anúncios, navegação e invalidação só ocorrem após passar por (1) e (2).
4. **Isolamento por sessão:** evento privado com `userId`/`sessionId` diferente da sessão atual é descartado. Ao trocar de usuário, o socket é desconectado, o mapa de versões e o LRU de dados privados são limpos e uma nova conexão é aberta com o novo token. O servidor simulado também só envia para a sala do usuário autenticado na conexão.
5. **Ciclo de vida:** cada hook de assinatura (`useNftSubscription`, `useOrderSubscription`) registra listeners em `useEffect` e os remove no cleanup; o roteador de eventos é único e não acumula handlers.

## Reconciliação REST ↔ Socket.IO

| Gatilho                                                  | Ação                                                                                                                                           |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `connect` após desconexão (`socket.recovered === false`) | `invalidateQueries` em: detalhes de NFT ativos, listas ativas, `cart`, `quote` ativa, pedidos `pending` em observação; reemite `nft.subscribe` |
| Socket desconectado com pedido pendente                  | Polling de `GET /orders/:id` a cada 5 s (somente enquanto desconectado e pendente)                                                             |
| Refresh da página com checkout em andamento              | Lê `checkout:attempt` em `sessionStorage` e `GET /orders?status=pending`; se houver pedido, abre a tela do pedido                              |
| Resposta REST com `version`                              | Registra versão no mapa; evento posterior com versão menor ou igual é ignorado                                                                 |
| Mutation local (ex.: alterar quantidade)                 | Resposta da mutation substitui o carrinho no cache; evento com a mesma versão é no-op                                                          |

A API REST é sempre a fonte de verdade: eventos aceleram a atualização, a reconciliação corrige lacunas.

## Cenário obrigatório: alteração com item no carrinho

1. Item `nft_A / ed_1` no carrinho.
2. Mock altera preço/disponibilidade no banco (`/__mock/nfts/:id` ou cenário `price-change-checkout`) e emite `nft.updated` com `version + 1` — a mesma mudança aparece no REST.
3. Cliente invalida `cart`/`quote`; `GET /cart` retorna `issues: [PRICE_CHANGED]`; a linha mostra a alteração, a região `aria-live` anuncia e o resumo é atualizado.
4. No pagamento, a cotação aberta é invalidada; `POST /orders` com a cotação antiga retornaria `409 QUOTE_STALE`, e a UI já bloqueia a confirmação até o usuário revisar a nova cotação.

## Cenário obrigatório: queda com pedido pendente

1. `POST /orders` → `pending`; tentativa salva em `sessionStorage` (`idempotencyKey`, `orderId`).
2. Socket cai; o mock confirma o pedido durante a queda (o `order.updated` é perdido).
3. Ao reconectar (ou recarregar), o cliente reconcilia via `GET /orders/:id` e exibe `confirmed`.
4. Nenhum novo `POST /orders` é feito; se for refeito, a mesma chave devolve o mesmo pedido.
5. `confirmed` e `declined` são terminais: eventos posteriores para o pedido são ignorados.
