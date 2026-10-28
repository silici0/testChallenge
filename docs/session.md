# Política de sessão

Decisão: [ADR-0010](adr/0010-sessao-e-autenticacao-simuladas.md).

## Modelo

| Item                     | Regra                                                                                                             |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Token                    | Opaco (`sess_<uuid>`), emitido por `/auth/login` e `/auth/register`                                               |
| Armazenamento no cliente | `localStorage["auth:token"]` — necessário para recuperar a sessão após refresh                                    |
| Expiração                | 30 min sliding; renovada por `GET /auth/session` e por requisições privadas                                       |
| Fonte de verdade         | Sessão no banco simulado; o cliente nunca decide se está autenticado sem `GET /auth/session`                      |
| Senhas                   | PBKDF2-SHA256 (Web Crypto, 100 000 iterações) + salt por usuário no banco simulado; nunca em claro, nunca logadas |

## Bootstrap

1. `main.tsx` inicia MSW (se ativo), cria `QueryClient` e o router.
2. `auth` no contexto do router executa `ensureQueryData(['session'])` → `GET /auth/session` (se houver token).
3. Guards (`beforeLoad`) aguardam a sessão; rotas privadas redirecionam para `/login?redirect=<href atual>`.
4. Com sessão válida, o socket conecta com o token.

## Rotas protegidas

Checkout, pedidos, perfil, carteiras e favoritos exigem autenticação. Login e cadastro redirecionam usuários autenticados para `redirect` (ou `/`). `redirect` só aceita paths internos (começando com `/`, sem `//`), evitando open redirect.

Cada rota privada declara `staticData: { requiresAuth: true }` junto do guard. Se o visitante fechar o modal de login ou cadastro, ele volta ao `redirect` apenas quando esse destino é público. Quando o destino é privado, vai para a Início, porque voltar à rota privada faria o guard reabrir o login em loop.

## Expiração

| Onde                     | Comportamento                                                                                                                                                                                                                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Navegação                | Interceptor Axios recebe `401 SESSION_EXPIRED` → `session.expire()`: remove token, limpa dados privados do cache, desconecta socket, anuncia “Sua sessão expirou” e navega para `/login?redirect=<href>&reason=expired`                                                                  |
| Checkout                 | Igual, e antes do redirect o rascunho do checkout (etapa, dados do comprador, carteira e rede escolhidas — sem dados sensíveis) já está em `sessionStorage["checkout:draft"]`; após login o usuário volta para `/checkout?step=<etapa>` com o rascunho restaurado e uma **nova** cotação |
| Pedido já criado         | `checkout:attempt` mantém `orderId` e `idempotencyKey`; após relogin, o estado do pedido é recuperado sem nova compra                                                                                                                                                                    |
| Requisições concorrentes | Um único `expire()` por sessão (flag), demais 401 são descartados                                                                                                                                                                                                                        |

O carrinho não se perde: ele está no servidor simulado (do usuário).

## Logout e troca de usuário

`session.logout()`:

1. `POST /auth/logout` (falha não impede a limpeza local).
2. `socket.disconnect()` e remoção de listeners/assinaturas privadas.
3. `queryClient.cancelQueries()` e `queryClient.removeQueries({ queryKey: ['user'] })` — todas as queries privadas vivem sob `['user', userId, …]`.
4. Remove `auth:token`, `checkout:draft`, `checkout:attempt`.
5. Limpa o mapa de versões/eventos privados do roteador de tempo real.
6. Novo `guestCartId` (carrinho de visitante vazio) e `router.invalidate()`.

Login de outro usuário sem logout explícito executa os passos 2–5 antes de aplicar a nova sessão. Como as chaves incluem `userId`, mesmo uma resposta atrasada do usuário anterior não é lida pelo novo (e é descartada pelo `AbortSignal`).

## Validação

Formulários de login, cadastro, perfil e senha usam os schemas Zod de `src/contracts/auth.ts` e `profile.ts` no cliente; `fieldErrors` da API (422/409) são mapeados para os mesmos campos com `setError`.
