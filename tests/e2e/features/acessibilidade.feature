# language: pt
Funcionalidade: Acessibilidade e teclado
  Como colecionador que navega por teclado ou leitor de tela
  Quero usar todas as telas sem mouse e com semântica correta
  Para comprar NFTs com autonomia

  @main
  Esquema do Cenário: Página pública sem violações do axe
    Dado que acesso a rota "<rota>"
    Então a página não tem violações de acessibilidade

    Exemplos:
      | rota                        |
      | /                           |
      | /nfts/nft_emerald-ape-042   |
      | /cart                       |
      | /login                      |
      | /register                   |
      | /rota-que-nao-existe        |

  Esquema do Cenário: Página autenticada sem violações do axe
    Dado que estou autenticado como "ana@example.test"
    Quando navego para "<rota>"
    Então a página não tem violações de acessibilidade

    Exemplos:
      | rota               |
      | /account/profile   |
      | /account/wallets   |
      | /account/favorites |

  Cenário: Skip link leva o foco ao conteúdo principal
    Dado que acesso a página inicial
    Quando pressiono "Tab"
    Então o foco está no link "Ir para o conteúdo"
    Quando pressiono "Enter"
    Então o foco está no conteúdo principal

  Cenário: Erros de validação focam o primeiro campo inválido
    Dado que acesso a rota "/login"
    Quando ativo pelo teclado o botão "Entrar"
    Então o foco está no campo "E-mail"
    E o campo "E-mail" está marcado como inválido

  Cenário: Diálogo prende o foco e devolve ao gatilho ao fechar
    Dado que acesso a rota "/nfts/nft_emerald-ape-042"
    Quando ativo pelo teclado o botão "Ampliar imagem de Emerald Ape #042"
    Então o foco permanece no diálogo ao navegar com Tab
    Quando pressiono "Escape"
    Então o diálogo fecha e o foco volta ao botão "Ampliar imagem de Emerald Ape #042"

  @main
  Cenário: Compra completa só com teclado
    Dado que estou autenticado como "ana@example.test"
    E tenho 1 unidades de "Emerald Ape #042" no carrinho
    Quando vou para o pagamento
    E ativo pelo teclado o botão "Conectar MetaMask"
    Então a carteira fica conectada
    Quando ativo pelo teclado o botão "Revisar pedido"
    Então o foco permanece no diálogo ao navegar com Tab
    Quando ativo pelo teclado o botão "Confirmar compra"
    Então depois vejo o recibo confirmado com "Emerald Ape #042"
    E a página não tem violações de acessibilidade
