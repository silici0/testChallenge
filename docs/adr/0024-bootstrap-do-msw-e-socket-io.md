# ADR-0024: Ordem de bootstrap do MSW e regras do Socket.IO simulado

- **Status:** Aceita
- **Data:** 2026-10-27
- **Requisitos do enunciado:** §6 (eventos via MSW com `socket.io-client`), §7
- **Complementa:** [ADR-0008](0008-socket-io-via-msw-binding.md)

## Contexto

O spike `src/mocks/socket-binding.browser.test.ts` (Chromium real) revelou quatro comportamentos que não estão na documentação do binding e que quebram silenciosamente: o socket fica em `opening` para sempre, sem erro.

1. **O `engine.io-client` captura `globalThis.WebSocket` ao ser importado.** Se o módulo carregar antes de `worker.start()`, ele usa o `WebSocket` nativo e nunca é interceptado.
2. **O MSW remove o prefixo `/socket.io/` do caminho antes do matching** (`WebSocketHandler.parse`). Um `ws.link` que aponta para `/socket.io/` nunca casa. O link precisa casar com a **origem** (`ws://host:porta`).
3. **O binding não expõe o pacote `CONNECT`** (o decoder só repassa `EVENT`). O `auth` do handshake não chega ao mock.
4. **O binding não envia `ping` do Engine.IO.** Com `pingInterval` de 25 s e `pingTimeout` de 5 s anunciados no handshake, o cliente encerraria a conexão a cada ~30 s.

## Decisão

1. `src/main.tsx` faz `await startMocks()` e só então `await import('./app/bootstrap')`. Nenhum módulo importado estaticamente pelo `main.tsx` pode depender de `socket.io-client`.
2. O handler do socket usa `ws.link(<origem de VITE_SOCKET_URL em ws/wss>)`.
3. O token da sessão vai em `query: { token }` (lido de `connection.client.url`). O cliente envia o mesmo token também em `auth`, para funcionar com um servidor real.
4. O handler envia o pacote de `ping` do Engine.IO (`"2"`) a cada 20 s enquanto a conexão estiver aberta.
5. Testes de tempo real rodam no projeto Vitest `integration` (Chromium). No Node, o `socket.io-client` usa o pacote `ws`, que o MSW não intercepta.

## Consequências

- O contrato do binding fica coberto por um teste de integração. Uma atualização do MSW ou do binding que quebre essas premissas falha a suíte.
- Usar o token na query é aceitável no ambiente simulado. Em produção, o token iria no `auth` do handshake (TLS + servidor real).
