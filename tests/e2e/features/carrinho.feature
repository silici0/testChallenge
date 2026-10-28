# language: pt
Funcionalidade: Carrinho de NFTs
  Como colecionador
  Quero ajustar meu carrinho e aplicar cupons
  Para ver o total coerente com a API antes de pagar

  Contexto:
    Dado que acesso a rota "/nfts/nft_emerald-ape-042?edition=ed_emerald-ape-042_aberta"
    Quando clico em "Comprar"
    Então vejo o título "Carrinho"

  @main
  Cenário: Quantidade, total recalculado pela API e persistência após refresh
    Quando defino a quantidade de "Emerald Ape #042" para 3
    Então o total de "Emerald Ape #042" corresponde a 3 unidades
    E o resumo mostra subtotal igual à soma das linhas
    Quando recarrego a página
    Então a quantidade de "Emerald Ape #042" é 3

  Cenário: Remover item deixa o carrinho vazio
    Quando removo "Emerald Ape #042" do carrinho
    Então vejo a mensagem "Seu carrinho está vazio"

  Cenário: Cupom válido, inválido e expirado
    Quando aplico o cupom "XYZ"
    Então o campo de cupom mostra o erro "Cupom inválido"
    Quando aplico o cupom "EXPIRED20"
    Então o campo de cupom mostra o erro "Este cupom expirou"
    Quando aplico o cupom "JUNGLE10"
    Então vejo a mensagem "Desconto (JUNGLE10)"
    Quando clico em "Remover cupom"
    Então vejo a mensagem "Desconto do lançamento"

  Cenário: Preço alterado em tempo real com o carrinho aberto
    Quando o preço da edição "ed_emerald-ape-042_aberta" do NFT "nft_emerald-ape-042" muda para "9.99"
    Então vejo a mensagem "Preço alterado"
    E o resumo mostra subtotal igual à soma das linhas

  @main
  Cenário: Itens do visitante são preservados ao entrar
    Quando entro pela página de login com "bruno@example.test" e senha "Jungle#2026"
    E navego para "/cart"
    Então vejo o item "Emerald Ape #042" no carrinho
