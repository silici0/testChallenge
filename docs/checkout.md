# Pagamento, pedidos e idempotência

Decisão: [ADR-0012](adr/0012-checkout-maquina-de-estados-e-idempotencia.md).

## Etapas

`/checkout?step=details|wallet|review`. Cada etapa é acessível diretamente, mas o guard redireciona para a primeira etapa incompleta.

| Etapa     | Conteúdo                                                                              | Validação                                                                                                |
| --------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `details` | Dados do colecionador conforme o layout (nome, e-mail, país…)                         | Zod no cliente + `fieldErrors` da API                                                                    |
| `wallet`  | Carteiras cadastradas (`GET /me/wallets`), seleção de rede, conectar (simulado)       | Carteira conectada e rede suportada; recusa (`WALLET_REJECTED`) e desconexão (`wallet.updated`) tratadas |
| `review`  | Itens, cupom, taxas e total da **cotação** (`POST /quotes`), botão “Confirmar compra” | Cotação sem `issues`, não expirada                                                                       |

Sem carteira cadastrada, a etapa `wallet` oferece link para `/account/wallets?redirect=/checkout?step=wallet`.

## Máquina de estados

```
editing ──► quoting ──► reviewing ──► submitting ──► pending ──► confirmed (terminal)
               ▲            │              │            │
               │            ▼              ▼            └──────► declined  (terminal)
               └──── stale (QUOTE_STALE / nft.updated / expirada)
                                           │
                                   timeout/rede ──► retrying (mesma chave)
```

- `stale`: mostra o diff (preço, disponibilidade, cupom, taxa), atualiza o resumo e exige nova confirmação.
- `submitting`/`retrying`: botão desabilitado (`aria-disabled` + `aria-busy`), cliques extras ignorados; a mutation usa `scope: { id: 'order' }` para serializar.

## Idempotência

| Momento                                          | Ação                                                                                                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Usuário clica “Confirmar compra” com uma cotação | Gera `Idempotency-Key` (uuid v4) **por tentativa**, associada a `quoteId` + corpo; salva em `sessionStorage["checkout:attempt"]` antes de enviar |
| Timeout / erro de rede / 5xx                     | Reenvia o **mesmo** corpo com a **mesma** chave (até 3 vezes, backoff 1 s, 2 s, 4 s); o servidor devolve o mesmo pedido                          |
| Recarregar durante `submitting`                  | Reenvia a tentativa salva com a mesma chave; se já houver `orderId`, apenas `GET /orders/:id`                                                    |
| Cotação mudou                                    | Nova tentativa ⇒ nova chave (o corpo mudou)                                                                                                      |
| `409 IDEMPOTENCY_CONFLICT`                       | Não deveria ocorrer pelo fluxo da UI; tratado como erro e registrado                                                                             |

No mock, o registro `idempotencyKey → { bodyHash, orderId }` é persistido com o banco, então funciona após refresh.

## Revalidação antes de confirmar

`POST /orders` revalida no servidor: preço de cada edição, disponibilidade, cupom (validade/expiração), taxa de rede e expiração da cotação. Qualquer divergência ⇒ `409 QUOTE_STALE` com nova cotação. O cliente também invalida a cotação ao receber `nft.updated` de item do carrinho, bloqueando a confirmação antes mesmo do envio.

## Estados do pedido

| Estado      | Tela `/orders/$orderId`                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------- |
| `pending`   | “Aguardando confirmação”, spinner acessível, identificação do pedido; sem recibo                                    |
| `confirmed` | Recibo: identificação da transação (simulada), itens, quantidades, subtotal, desconto, taxa, total, rede e carteira |
| `declined`  | Motivo, itens preservados no carrinho, ação “Voltar ao carrinho”                                                    |

A confirmação só é exibida quando `GET /orders/:id` (ou `order.updated` validado) retorna `confirmed`. A resposta `201 pending` nunca é tratada como sucesso.

O recibo é o snapshot `order.receipt` gravado na criação do pedido; mudanças posteriores no catálogo não o alteram (o mock não referencia o NFT ao montar o recibo).

## Recuperação

| Situação                    | Recuperação                                                                                   |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| Refresh com pedido pendente | `checkout:attempt.orderId` → `/orders/$orderId`; sem ele, `GET /orders?status=pending`        |
| Reconexão do socket         | Reconciliação via `GET /orders/:id` ([realtime.md](realtime.md#reconciliação-rest--socketio)) |
| Sessão expirada no checkout | Ver [session.md](session.md#expiração)                                                        |
| Estado terminal             | `checkout:attempt` removido; eventos posteriores ignorados                                    |
