# language: pt
Funcionalidade: Compra completa
  Como colecionador
  Quero comprar NFTs do catálogo até o recibo
  Para receber os NFTs na minha carteira

  @main
  Cenário: Do catálogo ao recibo confirmado
    Dado que estou autenticado como "ana@example.test"
    E tenho 2 unidades de "Emerald Ape #042" no carrinho
    Quando vou para o pagamento
    E conecto a carteira
    E reviso o pedido
    E confirmo a compra
    Então vejo o pedido aguardando confirmação
    E depois vejo o recibo confirmado com "Emerald Ape #042"
    Quando navego para "/cart"
    Então vejo a mensagem "Seu carrinho está vazio"

  Cenário: O recibo não muda quando o catálogo muda
    Dado que estou autenticado como "ana@example.test"
    E tenho 2 unidades de "Emerald Ape #042" no carrinho
    Quando concluo a compra
    E depois vejo o recibo confirmado com "Emerald Ape #042"
    E guardo o total do recibo
    Quando o preço da edição "ed_emerald-ape-042_aberta" do NFT "nft_emerald-ape-042" muda para "99"
    E recarrego a página
    Então o total do recibo é o mesmo
