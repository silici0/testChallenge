# language: pt
Funcionalidade: Favoritos
  Como colecionador autenticado
  Quero favoritar NFTs
  Para acompanhá-los na minha lista de interesse

  Cenário: Favoritar com atualização otimista e persistência
    Dado que estou autenticado como "bruno@example.test"
    Quando navego para "/"
    E favorito o NFT "Emerald Ape #042"
    Então o NFT "Emerald Ape #042" aparece como favorito
    E vejo o anúncio "Adicionado aos favoritos."
    Quando recarrego a página
    Então o NFT "Emerald Ape #042" aparece como favorito

  Cenário: Falha ao favoritar desfaz a mudança e permite recuperar
    Dado que estou autenticado como "bruno@example.test"
    E o cenário de simulação muda para "favorite-failure"
    Quando navego para "/"
    E favorito o NFT "Emerald Ape #042"
    Então vejo o alerta "Não foi possível atualizar o favorito"
    E o NFT "Emerald Ape #042" não aparece como favorito
    Quando o cenário de simulação muda para "default"
    E favorito o NFT "Emerald Ape #042"
    Então o NFT "Emerald Ape #042" aparece como favorito
