# Estado do carrinho

## Onde vive

O carrinho é **estado do servidor simulado**, não do cliente. O cliente guarda apenas o identificador do carrinho de visitante.

| Ator        | Identificação                                              | Persistência                                            |
| ----------- | ---------------------------------------------------------- | ------------------------------------------------------- |
| Visitante   | `X-Guest-Cart-Id` (uuid em `localStorage["cart:guestId"]`) | Banco simulado (persistido em `localStorage` pelo mock) |
| Autenticado | Sessão                                                     | Banco simulado, por usuário                             |

No cache: `['cart', 'guest', guestId]` para visitante e `['user', userId, 'cart']` para autenticado.

## Operações

| Ação               | Endpoint                 | Cache                                                                                                          |
| ------------------ | ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Ler                | `GET /cart`              | `staleTime: 0`, refetch ao focar                                                                               |
| Adicionar          | `POST /cart/items`       | `setQueryData` com o `Cart` retornado                                                                          |
| Alterar quantidade | `PATCH /cart/items/:id`  | Debounce de 400 ms no stepper; resposta substitui o cache; mutations da mesma linha são serializadas (`scope`) |
| Remover            | `DELETE /cart/items/:id` | Resposta substitui o cache; anúncio “Item removido”                                                            |
| Aplicar cupom      | `PUT /cart/coupon`       | Resposta substitui o cache; 422 vira erro do campo                                                             |
| Remover cupom      | `DELETE /cart/coupon`    | Resposta substitui o cache                                                                                     |

Disponibilidade é validada pela API (`409 AVAILABILITY_CONFLICT` com `details.available`); o stepper também limita a `min(available, maxPerOrder)` para evitar requisições inúteis, mas não substitui a validação do servidor.

## Merge ao autenticar

`POST /auth/login` e `/auth/register` aceitam `guestCartId`. O servidor:

1. Para cada item do visitante, soma ao item equivalente do usuário (mesmo `nftId` + `editionId`), limitando a `min(available, maxPerOrder)` e gerando `QUANTITY_REDUCED` se necessário.
2. Mantém o cupom do usuário; se não houver, adota o do visitante (revalidado).
3. Esvazia o carrinho do visitante.

O cliente então descarta `['cart','guest',guestId]`, gera novo `guestCartId` para uso pós-logout e lê o carrinho do usuário.

## Resumo de valores

`subtotal`, `desconto`, `taxa de rede` e `total` vêm **sempre** de `Cart.summary` / `Quote` calculados pela API. O cliente não soma valores para exibir o resumo. A única conta local é `unitPriceEth × quantity` para pré-visualização instantânea da linha durante o debounce, feita em `bigint` e substituída pela resposta.

A taxa de rede no carrinho é estimada para a rede padrão (`ethereum`); no pagamento, a cotação usa a rede escolhida.

## Precisão em ETH

Decisão: [ADR-0011](adr/0011-valores-eth-como-string-decimal.md).

- Transporte: string decimal (`"0.125"`), até 18 casas.
- Cálculo: `src/shared/lib/money.ts` converte para `bigint` em wei (`parseEth`), opera e volta (`formatEth`). Nunca `Number`/`parseFloat`.
- Apresentação: valor exato sem arredondamento, removendo zeros à direita; separador conforme `pt-BR` apenas na parte inteira/decimal, mantendo todas as casas significativas. Abreviações visuais (se o Figma exigir) mantêm o valor completo em `title`/texto acessível.
- Quantidades: inteiros validados com `z.number().int().positive()`.

## Alterações em tempo real

Com o carrinho aberto, `nft.updated` de um NFT presente invalida o carrinho; a resposta traz `issues` (`PRICE_CHANGED`, `QUANTITY_REDUCED`, `SOLD_OUT`), exibidas na linha com texto + ícone e anunciadas em `aria-live`. O resumo é atualizado pela nova resposta. Ver [realtime.md](realtime.md#cenário-obrigatório-alteração-com-item-no-carrinho).

## Após o pedido

- `confirmed`: o servidor remove somente os itens/quantidades do `receipt`; itens adicionados depois da cotação permanecem. O cliente invalida o carrinho.
- `declined` ou falha: nada é removido.
