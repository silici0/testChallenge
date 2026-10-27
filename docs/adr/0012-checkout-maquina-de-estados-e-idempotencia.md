# ADR-0012: Checkout como máquina de estados com idempotência por tentativa

- **Status:** Aceita
- **Data:** 2026-10-27
- **Requisitos do enunciado:** §3.3, §5 (criação idempotente), §7 (pedido pendente com queda de conexão)

## Contexto

É preciso revalidar a cotação antes de confirmar, exigir nova confirmação após mudanças, impedir pedidos duplicados (cliques e reenvio após timeout), representar pendente/confirmado/recusado com recuperação após refresh e exibir o recibo apenas para pedidos confirmados pela simulação.

## Decisão

- Estados explícitos: `editing → quoting → reviewing → submitting → pending → confirmed | declined`, com `stale` e `retrying` (`docs/checkout.md`).
- `Idempotency-Key` gerada por tentativa (cotação + corpo), persistida em `sessionStorage` antes do envio e reutilizada em retries e após refresh.
- Servidor simulado guarda `chave → hash do corpo + orderId`; mesma chave e corpo ⇒ mesmo pedido; corpo diferente ⇒ 409.
- `POST /orders` revalida tudo e responde `409 QUOTE_STALE` com nova cotação.
- Confirmação exibida apenas para `status === 'confirmed'` vindo da API/evento validado; recibo é snapshot gravado no pedido.
- Itens removidos do carrinho pelo servidor somente na confirmação, nas quantidades compradas.

## Consequências

- Fluxo verificável pelos specs 6, 7, 9 e 10.

## Alternativas consideradas

- Chave por clique — retries após timeout gerariam pedidos duplicados.
- Chave derivada só do carrinho — impediria recompra legítima do mesmo conteúdo.
