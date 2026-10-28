# language: pt
Funcionalidade: Perfil do colecionador
  Como colecionador
  Quero manter meus dados, avatar e senha
  Para que as alterações confirmadas permaneçam

  Contexto:
    Dado que estou autenticado como "bruno@example.test"
    Quando navego para "/account/profile"

  Cenário: Editar o nome de exibição persiste após refresh e atualiza o cabeçalho
    Quando preencho "Nome de exibição" com "Bruno Colecionador"
    E clico em "Salvar"
    Então vejo a mensagem "Alterações salvas."
    Quando recarrego a página
    Então o campo "Nome de exibição" contém "Bruno Colecionador"
    E estou autenticado como "Bruno Colecionador"

  Cenário: Senha atual incorreta
    Quando preencho "Senha atual" com "Errada#2026"
    E preencho "Nova senha" com "Nova#2026x"
    E preencho "Confirmar nova senha" com "Nova#2026x"
    E clico em "Alterar senha"
    Então o campo "Senha atual" mostra o erro "Senha atual incorreta"

  Cenário: Erro de validação retornado pela API
    Quando o cenário de simulação muda para "form-validation"
    E clico em "Salvar"
    Então o campo "Nome de usuário" mostra o erro "Nome de usuário reservado (simulado)"

  Cenário: Enviar avatar
    Quando envio o avatar "public/logos/logo.svg" como PNG
    Então vejo a imagem "Seu avatar"
