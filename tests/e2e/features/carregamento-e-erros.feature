# language: pt
Funcionalidade: Carregamento e erros
  Como colecionador em uma rede instável
  Quero ver o progresso do carregamento e conseguir me recuperar de falhas
  Para não perder o contexto nem ver a tela pular

  @main
  Esquema do Cenário: Skeleton em rede lenta até o conteúdo chegar
    Dado que o cenário de simulação "slow-network" está ativo
    E que acesso a rota "<rota>"
    Então vejo o indicador de carregamento "<indicador>"
    E depois vejo o título "<título>"

    Exemplos:
      | rota                      | indicador                    | título           |
      | /nfts/nft_emerald-ape-042 | Carregando NFT               | Emerald Ape #042 |
      | /cart                     | Carregando itens do carrinho | Carrinho         |

  Esquema do Cenário: A troca de skeleton por conteúdo não desloca o layout
    Dado que o cenário de simulação "slow-network" está ativo
    E que acesso a rota "<rota>"
    Quando o conteúdo termina de carregar
    Então o deslocamento acumulado de layout é menor que 0.1

    Exemplos:
      | rota                      |
      | /                         |
      | /nfts/nft_emerald-ape-042 |

  Cenário: Falha no detalhe com nova tentativa e recuperação
    Dado que o cenário de simulação "http-errors" está ativo
    E que acesso a rota "/nfts/nft_emerald-ape-042"
    Então vejo o alerta "Não foi possível carregar este NFT"
    Quando o cenário de simulação muda para "default"
    E clico em "Tentar novamente"
    Então vejo o título "Emerald Ape #042"

  Cenário: Falha transitória é recuperada sem ação do usuário
    Dado que o cenário de simulação "server-error" está ativo
    E que acesso a rota "/nfts/nft_emerald-ape-042"
    Então depois vejo o título "Emerald Ape #042"

  Cenário: Movimento reduzido desativa o shimmer
    Dado que prefiro movimento reduzido
    E que o cenário de simulação "slow-network" está ativo
    E que acesso a rota "/nfts/nft_emerald-ape-042"
    Então vejo o indicador de carregamento "Carregando NFT"
    E os skeletons estão estáticos
