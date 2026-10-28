# language: pt
Funcionalidade: Painel de simulação
  Como avaliador do deploy de demonstração
  Quero trocar o cenário do servidor simulado sem editar a URL
  Para exercitar estados de erro, vazio e tempo real

  @main
  Cenário: Aplicar um cenário e resetar os dados pelo painel
    Dado que acesso a página inicial
    E vejo o NFT "Emerald Ape #042" no catálogo
    Quando aplico o cenário "empty-catalog" pelo painel
    Então vejo a mensagem "Nenhum NFT encontrado"
    Quando reseto os dados pelo painel
    Então depois vejo o NFT "Emerald Ape #042" no catálogo

  Cenário: Derrubar e restaurar o tempo real pelo painel
    Dado que acesso a página inicial
    E vejo o indicador "Tempo real conectado"
    Quando uso "Derrubar conexão" no painel
    Então vejo o indicador "Tempo real desconectado"
    Quando uso "Restaurar conexão" no painel
    Então depois vejo o indicador "Tempo real conectado"
