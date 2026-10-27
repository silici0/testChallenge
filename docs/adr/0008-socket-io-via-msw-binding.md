# ADR-0008: Socket.IO real no cliente, servidor simulado via @mswjs/socket.io-binding

- **Status:** Aceita
- **Data:** 2026-10-27
- **Requisitos do enunciado:** §6 (eventos com MSW, `socket.io-client`), §7, §11 (eliminatório: eventos simulados diretamente na UI)

## Contexto

Eventos `nft.updated` e `order.updated` devem chegar por `socket.io-client`, com identidade estável, recurso e versão, tolerância a duplicatas/eventos antigos, reconciliação após reconexão e isolamento entre sessões.

## Decisão

- Cliente: instância única de `socket.io-client` com `transports: ['websocket']`, token no handshake, reconexão com backoff.
- Servidor simulado: `ws.link()` do MSW + `toSocketIo()` do `@mswjs/socket.io-binding`, assinando o barramento de mudanças do banco simulado (ADR-0006).
- Envelope `{ eventId, type, resource, version, occurredAt, userId, sessionId, data }` validado por Zod.
- Roteador de eventos no cliente com LRU de `eventId`, mapa de versões alimentado por REST e eventos, descarte de eventos de outra sessão e efeitos aplicados uma única vez.
- Após `connect` pós-queda: invalidação dos recursos ativos e reassinatura.

Detalhes e limitações: `docs/realtime.md`.

## Consequências

- O mesmo cliente funcionaria contra um servidor Socket.IO real.
- Sem fallback para long-polling no ambiente de mocks.

## Alternativas consideradas

- EventEmitter local ou chamada direta ao cache — eliminatório.
- Servidor Socket.IO em Node no deploy — exigiria infraestrutura além do deploy estático.
