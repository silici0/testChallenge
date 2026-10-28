# language: pt
Funcionalidade: Carteiras
  Como colecionador
  Quero cadastrar carteiras principal e secundária
  Para usá-las no pagamento

  Contexto:
    Dado que estou autenticado como "bruno@example.test"
    Quando navego para "/account/wallets"

  @main
  Cenário: Adicionar carteira secundária e manter após refresh
    Quando adiciono a carteira secundária "Reserva" na rede "Polygon" com o endereço "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4"
    Então vejo a mensagem "Carteira salva."
    Quando recarrego a página
    Então a seção "Carteira secundária" mostra o endereço "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4"

  Cenário: Endereço inválido para a rede
    Quando preencho "Endereço da carteira" com "0x123"
    E clico em "Salvar carteira"
    Então o campo "Endereço da carteira" mostra o erro "Endereço 0x inválido"

  Cenário: Erro de validação retornado pela API
    Quando o cenário de simulação muda para "form-validation"
    E clico em "Salvar carteira"
    Então o campo "Endereço da carteira" mostra o erro "Endereço bloqueado pela análise de risco"
