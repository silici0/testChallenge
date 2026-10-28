# language: pt
Funcionalidade: Falhas de pagamento
  Como colecionador
  Quero que falhas não percam meus itens nem dupliquem a compra

  Contexto:
    Dado que estou autenticado como "ana@example.test"
    E tenho 1 unidades de "Emerald Ape #042" no carrinho

  Cenário: Pagamento recusado preserva os itens
    Quando o cenário de simulação muda para "payment-declined"
    E concluo a compra
    Então depois vejo a mensagem "Pagamento recusado"
    Quando navego para "/cart"
    Então vejo o item "Emerald Ape #042" no carrinho

  Cenário: Cliques repetidos criam um único pedido
    Quando vou para o pagamento
    E conecto a carteira
    E reviso o pedido
    E clico em "Confirmar compra" 3 vezes rapidamente
    Então depois vejo o pedido aguardando confirmação
    E existe exatamente 1 pedido novo

  Cenário: Timeout após criar o pedido recupera o mesmo pedido
    Quando o cenário de simulação muda para "order-timeout"
    E concluo a compra
    Então depois vejo o pedido aguardando confirmação
    E existe exatamente 1 pedido novo
