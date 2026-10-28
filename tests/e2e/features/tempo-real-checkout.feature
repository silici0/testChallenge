# language: pt
Funcionalidade: Tempo real durante o checkout
  Como colecionador
  Quero ser avisado de mudanças de preço e disponibilidade
  Para nunca confirmar com uma cotação desatualizada

  Contexto:
    Dado que estou autenticado como "ana@example.test"
    E tenho 1 unidades de "Emerald Ape #042" no carrinho
    Quando vou para o pagamento
    E conecto a carteira
    E reviso o pedido

  @main
  Cenário: Preço alterado durante a revisão bloqueia a confirmação
    Quando o preço da edição "ed_emerald-ape-042_aberta" do NFT "nft_emerald-ape-042" muda para "9.99"
    Então vejo o alerta "A cotação mudou desde a sua revisão"
    E a confirmação está bloqueada
    Quando clico em "Revisar com os novos valores"
    E confirmo a compra
    Então vejo o pedido aguardando confirmação

  Cenário: Edição esgota durante a revisão
    Quando a edição "ed_emerald-ape-042_aberta" do NFT "nft_emerald-ape-042" fica com 0 unidades
    Então vejo o alerta "A cotação mudou desde a sua revisão"
    E a confirmação está bloqueada
