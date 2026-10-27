# ADR-0009: Cliente Axios único com normalização de erros

- **Status:** Aceita
- **Data:** 2026-10-27
- **Requisitos do enunciado:** §2, §4 (chamadas REST pelo Axios, recuperação sem duplicar operações), §5 (representação de erros)

## Contexto

Todas as chamadas REST devem passar pelo Axios, com tratamento uniforme de sessão, timeout, cancelamento e erros.

## Decisão

- `src/shared/api/client.ts`: instância com `baseURL`, `timeout = VITE_REQUEST_TIMEOUT_MS`.
- Interceptor de requisição: `Authorization` (sessão) ou `X-Guest-Cart-Id` (visitante); `X-Request-Id`.
- Interceptor de resposta: converte qualquer falha em `ApiError { status, code, message, fieldErrors, details, retryable }` (inclui `NETWORK_ERROR`, `TIMEOUT`, `CANCELED`); `401 SESSION_EXPIRED` dispara `session.expire()` uma única vez.
- `Idempotency-Key` passado explicitamente pela mutation de pedido (não gerado pelo interceptor, para que retries reutilizem a mesma chave).
- O cliente não contém lógica de negócio nem respostas fictícias.

## Consequências

- UI e Query trabalham com um único tipo de erro.

## Alternativas consideradas

- `fetch` nativo — fora da stack obrigatória.
