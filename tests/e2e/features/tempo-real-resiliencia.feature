# language: pt
Funcionalidade: Resiliência do tempo real
  Como colecionador
  Quero recuperar meu pedido após quedas e recargas
  Sem criar outra compra

  Cenário: Queda do socket com pedido pendente é reconciliada
    Dado que estou autenticado como "ana@example.test"
    E tenho 1 unidades de "Emerald Ape #042" no carrinho
    Quando o cenário de simulação muda para "socket-drop-pending"
    E concluo a compra
    Então depois vejo o recibo confirmado com "Emerald Ape #042"
    E existe exatamente 1 pedido novo

  Cenário: Recarregar com pedido pendente recupera o mesmo pedido
    Dado que estou autenticado como "ana@example.test"
    E tenho 1 unidades de "Emerald Ape #042" no carrinho
    Quando concluo a compra
    E vejo o pedido aguardando confirmação
    E recarrego a página
    Então depois vejo o recibo confirmado com "Emerald Ape #042"
    E existe exatamente 1 pedido novo

  Cenário: Eventos duplicados ou antigos não regridem o estado
    Dado que estou autenticado como "ana@example.test"
    E tenho 1 unidades de "Emerald Ape #042" no carrinho
    Quando o cenário de simulação muda para "duplicate-events"
    E navego para "/cart"
    E o preço da edição "ed_emerald-ape-042_aberta" do NFT "nft_emerald-ape-042" muda para "1.5"
    Então o preço unitário de "Emerald Ape #042" se mantém em "1.5" ETH
