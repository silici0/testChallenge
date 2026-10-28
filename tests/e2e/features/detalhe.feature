# language: pt
Funcionalidade: Detalhes do NFT
  Como colecionador
  Quero ver um NFT, escolher a edição e a quantidade
  Para comprar dentro dos limites disponíveis

  @main
  Cenário: Acesso direto ao detalhe e navegação a partir do catálogo
    Dado que acesso a rota "/nfts/nft_emerald-ape-042"
    Então vejo o título "Emerald Ape #042"
    E a edição "1/50" está selecionada
    E a página não tem rolagem horizontal
    Quando recarrego a página
    Então vejo o título "Emerald Ape #042"

  Cenário: NFT inexistente
    Dado que acesso a rota "/nfts/nao-existe"
    Então vejo a mensagem "NFT não encontrado"

  Cenário: Edição esgota em tempo real e fica indisponível
    Dado que acesso a rota "/nfts/nft_emerald-ape-042"
    Quando a edição "ed_emerald-ape-042_1-10" do NFT "nft_emerald-ape-042" fica com 0 unidades
    Então a edição "1/10" está desabilitada como esgotada

  Cenário: Limite de quantidade por disponibilidade
    Dado que acesso a rota "/nfts/nft_emerald-ape-042"
    Quando a edição "ed_emerald-ape-042_1-10" do NFT "nft_emerald-ape-042" fica com 2 unidades
    E seleciono a edição "1/10"
    Então vejo a mensagem "Restam 2 nesta edição"
    Quando aumento a quantidade 2 vezes
    Então a quantidade é 2
    E não consigo aumentar mais a quantidade

  @main
  Cenário: Comprar adiciona ao carrinho e leva ao carrinho
    Dado que acesso a rota "/nfts/nft_emerald-ape-042"
    Quando clico em "Comprar"
    Então vejo o título "Carrinho"
