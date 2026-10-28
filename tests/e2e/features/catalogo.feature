# language: pt
Funcionalidade: Catálogo com estado na URL
  Como colecionador
  Quero buscar, filtrar, ordenar e paginar NFTs
  Para encontrar obras e compartilhar a mesma visão por link

  @main
  Cenário: Filtros combinados reiniciam a paginação e sobrevivem ao refresh
    Dado que acesso a página inicial
    Quando vou para a página 2 do catálogo
    E marco o filtro "Música" em "Coleções"
    Então a URL contém "category=musica"
    E a URL não contém "page="
    Quando marco o filtro "Polygon" em "Rede"
    Então a URL contém "network=polygon"
    E todos os cards exibidos pertencem ao catálogo filtrado
    Quando recarrego a página
    Então o filtro "Música" em "Coleções" está marcado
    E o filtro "Polygon" em "Rede" está marcado

  Cenário: Ordenação e restauração pelo histórico
    Dado que acesso a página inicial
    Quando ordeno por "Menor preço"
    Então a URL contém "sort=price-asc"
    E os preços estão em ordem crescente
    Quando vou para a página 2 do catálogo
    E volto no histórico do navegador
    Então a página atual do catálogo é 1
    E a URL contém "sort=price-asc"

  Cenário: Busca com resultado e sem resultado
    Dado que acesso a página inicial
    Quando busco por "emerald"
    Então vejo o NFT "Emerald Ape #042" no catálogo
    Quando busco por "nao-existe-xyz"
    Então vejo a mensagem "Nenhum NFT encontrado"

  Cenário: Respostas fora de ordem não sobrescrevem a busca mais recente
    Dado que o cenário de simulação "out-of-order" está ativo
    E que acesso a página inicial
    Quando ordeno por "Maior preço"
    E ordeno por "Nome (A–Z)"
    Então a URL contém "sort=name-asc"
    E os nomes estão em ordem alfabética

  Cenário: Skeletons durante carregamento lento
    Dado que o cenário de simulação "slow-network" está ativo
    Quando acesso a página inicial sem esperar os dados
    Então vejo o indicador de carregamento "Carregando NFTs"
    E depois vejo o NFT "Emerald Ape #042" no catálogo

  Cenário: Falha com nova tentativa e recuperação
    Dado que o cenário de simulação "http-errors" está ativo
    E que acesso a página inicial
    Então vejo o alerta "Não foi possível carregar o catálogo"
    Quando o cenário de simulação muda para "default"
    E clico em "Tentar novamente"
    Então vejo o NFT "Emerald Ape #042" no catálogo
