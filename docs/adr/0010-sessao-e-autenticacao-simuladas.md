# ADR-0010: Sessão por token opaco e senhas com hash no servidor simulado

- **Status:** Aceita
- **Data:** 2026-10-27
- **Requisitos do enunciado:** §3.4 (sessão recuperável, expiração, logout/troca limpando cache e subscriptions, sem senhas em claro)

## Contexto

Não há backend; o Service Worker do MSW não consegue emitir cookies `HttpOnly`. A sessão precisa sobreviver a refresh, expirar durante navegação e checkout e ser isolada por usuário.

## Decisão

- Token opaco emitido pelo mock, guardado em `localStorage["auth:token"]`, enviado como Bearer e no handshake do socket.
- Sessão no banco simulado com expiração sliding de 30 min; `GET /auth/session` é a fonte de verdade.
- Senhas armazenadas como PBKDF2-SHA256 (Web Crypto) + salt; fixtures com hashes pré-calculados; senha nunca persistida nem logada.
- Expiração ⇒ limpeza de dados privados, socket desconectado, redirect com `redirect`/`reason` e rascunho do checkout preservado.
- Logout/troca de usuário ⇒ `removeQueries(['user'])`, socket desconectado e reconectado, mapas de eventos limpos.

Detalhes: `docs/session.md`.

## Consequências

- Token acessível a JS (risco XSS) — aceitável num ambiente simulado; em produção seria cookie `HttpOnly` + `SameSite`.

## Alternativas consideradas

- Cookie não `HttpOnly` via `document.cookie` — sem ganho de segurança sobre `localStorage`.
- JWT — sem servidor para assinar com segredo; token opaco é mais honesto.
