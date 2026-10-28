# language: pt
Funcionalidade: Página inicial
  Como colecionador
  Quero ver a vitrine da Kurio ao acessar o site
  Para começar a descobrir NFTs

  @main @responsive
  Cenário: Acesso direto à página inicial
    Dado que acesso a página inicial
    Então vejo o título "SEJA DONO DO FUTURO DA ARTE DIGITAL"
    E a página não tem rolagem horizontal
    E vejo o indicador "Tempo real conectado"

  Cenário: Rota inexistente
    Dado que acesso a rota "/rota-que-nao-existe"
    Então vejo a mensagem "Página não encontrada."
