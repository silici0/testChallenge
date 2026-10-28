# Cache, retries e sincronização (TanStack Query)

Decisão: [ADR-0004](adr/0004-tanstack-query-politica-de-cache.md).

## Query keys

Fábricas em `src/features/*/keys.ts`. Tudo que é privado fica sob `['user', userId]` para ser removido em bloco no logout/troca de usuário.

| Recurso              | Key                                              | `staleTime`                         | `gcTime`   |
| -------------------- | ------------------------------------------------ | ----------------------------------- | ---------- |
| Sessão               | `['session']`                                    | `Infinity` (refeita explicitamente) | `Infinity` |
| Destaques            | `['nfts','featured']`                            | 60 s                                | 5 min      |
| Facets               | `['nfts','facets']`                              | 5 min                               | 10 min     |
| Listagem             | `['nfts','list', normalizedParams]`              | 30 s                                | 5 min      |
| Detalhe              | `['nfts','detail', nftId]`                       | 15 s                                | 5 min      |
| Favoritos            | `['user', uid, 'favorites']`                     | 60 s                                | 5 min      |
| Carrinho (usuário)   | `['user', uid, 'cart']`                          | 0                                   | 5 min      |
| Carrinho (visitante) | `['cart','guest', guestId]`                      | 0                                   | 5 min      |
| Cotação              | `['user', uid, 'quote', network]`                | 0                                   | 30 s       |
| Pedido               | `['user', uid, 'orders', orderId]`               | 0                                   | 10 min     |
| Pedidos pendentes    | `['user', uid, 'orders', { status: 'pending' }]` | 0                                   | 1 min      |
| Perfil               | `['user', uid, 'profile']`                       | 5 min                               | 10 min     |
| Carteiras            | `['user', uid, 'wallets']`                       | 60 s                                | 5 min      |

`normalizedParams` remove valores padrão e ordena arrays, para que URLs equivalentes compartilhem cache.

## Respostas obsoletas e fora de ordem

- Toda `queryFn` repassa `signal` ao Axios; mudar a key aborta a requisição anterior.
- Cada parâmetro tem sua própria key: uma resposta atrasada só escreve na key a que pertence, nunca na exibida.
- `appliedFilters` da resposta é comparado com os parâmetros da key; divergência gera erro de contrato (defesa adicional).
- Listagem usa `placeholderData: keepPreviousData` para evitar flicker, com indicação de atualização em segundo plano (`isPlaceholderData` / `isFetching`).

## Retries

| Tipo      | Política                                                                                                                                |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Queries   | Até 2 retries com backoff exponencial (500 ms, 1 s, + jitter) **somente** se `ApiError.retryable` (rede, timeout, 5xx, 429). 4xx nunca. |
| Mutations | `retry: 0`, exceto `POST /orders`: até 3 retries com a mesma `Idempotency-Key` em erro retryable.                                       |
| Socket    | Reconexão automática do Socket.IO com backoff; reconciliação após reconectar.                                                           |
| Manual    | Estados de erro oferecem “Tentar novamente” (`refetch`).                                                                                |

`refetchOnWindowFocus: true` para carrinho, cotação e pedidos; `false` para catálogo. `refetchOnReconnect: true` global.

## Invalidação após mutations

| Mutation                          | Efeito                                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| Login / cadastro                  | `setQueryData(['session'])`; remove carrinho de visitante; `router.invalidate()`                 |
| Logout / troca de usuário         | `cancelQueries` + `removeQueries(['user'])` + `removeQueries(['session'])`                       |
| Favoritar / desfavoritar          | Otimista (abaixo); `onSettled` invalida `['user',uid,'favorites']`                               |
| Carrinho (add/patch/delete/cupom) | `setQueryData` com `Cart` retornado; invalida `quote`                                            |
| Criar pedido                      | `setQueryData(['user',uid,'orders',id])`                                                         |
| `order.updated` terminal          | Invalida carrinho e pedidos pendentes                                                            |
| Perfil / avatar                   | `setQueryData(profile)`; atualiza `['session'].user` (nome/avatar no header)                     |
| Senha                             | Nada a invalidar                                                                                 |
| Carteiras                         | `setQueryData` na lista; invalida `quote` se a carteira estiver selecionada                      |
| `nft.updated`                     | `setQueryData` no detalhe e nas listas (versão maior); invalida carrinho/cotação se contém o NFT |

## Atualização otimista com rollback

**Favoritos** (exigido no enunciado: ao menos uma interação).

```ts
onMutate: async ({ nftId, favorite }) => {
  await qc.cancelQueries({ queryKey: keys.favorites(uid) })
  const previous = qc.getQueryData(keys.favorites(uid))
  qc.setQueryData(keys.favorites(uid), (d) => toggle(d, nftId, favorite))
  return { previous }
},
onError: (_e, _v, ctx) => { qc.setQueryData(keys.favorites(uid), ctx?.previous); announce('Não foi possível atualizar o favorito') },
onSettled: () => qc.invalidateQueries({ queryKey: keys.favorites(uid) }),
```

Cliques repetidos no mesmo NFT usam `scope: { id: 'favorite:' + nftId }` para serializar e evitar estado final inconsistente.

## Estados exibidos

Todo componente dependente de dados trata: **carregando** (skeleton com shimmer, dimensões fixas), **vazio**, **erro** (mensagem + “Tentar novamente”), **sucesso** e **atualização em segundo plano** (indicador discreto, `aria-busy` na região).
