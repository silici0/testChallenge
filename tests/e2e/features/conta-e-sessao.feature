# language: pt
Funcionalidade: Conta e sessão
  Como colecionador
  Quero criar conta, entrar e sair com segurança
  Para que meus dados fiquem isolados e a sessão sobreviva a recargas

  Cenário: Cadastro valida campos e trata conflito de e-mail
    Dado que acesso a rota "/register"
    Quando envio o cadastro com usuário "nova.conta", e-mail "taken@example.test" e senha "Jungle#2026"
    Então o campo "E-mail" mostra o erro "Este e-mail já está cadastrado"
    Quando envio o cadastro com usuário "nova.conta", e-mail "nova@example.test" e senha "fraca"
    Então o campo "Senha" mostra o erro "Mínimo de 8 caracteres"

  @main
  Cenário: Cadastro cria a conta e autentica
    Dado que acesso a rota "/register"
    Quando envio o cadastro com usuário "nova.conta", e-mail "nova@example.test" e senha "Jungle#2026"
    Então estou autenticado como "nova.conta"

  @main
  Cenário: Login retorna ao fluxo anterior e a sessão sobrevive ao refresh
    Dado que acesso a rota "/cart"
    Quando navego para "/checkout"
    Então estou na tela de login
    Quando entro com "ana@example.test" e senha "Jungle#2026"
    Então vejo o título "Pagamento"
    Quando recarrego a página
    Então estou autenticado como "Ana Collector"

  Cenário: Credenciais inválidas
    Dado que acesso a rota "/login"
    Quando entro com "ana@example.test" e senha "Errada#2026"
    Então o campo "Senha" mostra o erro "E-mail ou senha incorretos"

  Cenário: Sessão expira durante a navegação e o contexto é preservado
    Dado que estou autenticado como "ana@example.test"
    E o cenário de simulação muda para "session-expired"
    Quando navego para "/account/favorites"
    Então vejo o alerta "Sua sessão expirou"
    Quando o cenário de simulação muda para "default"
    E entro com "ana@example.test" e senha "Jungle#2026"
    Então vejo o título "Lista de interesse"

  Cenário: Logout e troca de usuário não vazam dados privados
    Dado que estou autenticado como "ana@example.test"
    Quando navego para "/account/favorites"
    Então vejo 3 NFTs na lista de interesse
    Quando saio da conta
    Então vejo o botão de entrar no cabeçalho
    Quando entro pela página de login com "bruno@example.test" e senha "Jungle#2026"
    E navego para "/account/favorites"
    Então vejo a mensagem "Nenhum favorito ainda"
