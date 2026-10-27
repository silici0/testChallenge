# ADR-0016: Deploy na Vercel com mocks ativos e fallback de SPA

- **Status:** Aceita
- **Data:** 2026-10-27
- **Requisitos do enunciado:** §6 (mocks no build de demonstração), §12 (deploy obrigatório, acesso direto e refresh)

## Contexto

O deploy público deve corresponder ao código, manter mocks e tempo real funcionando e suportar acesso direto/refresh de qualquer rota.

## Decisão

- Vercel (preset Vite), `pnpm build`, `VITE_ENABLE_MOCKS=true`.
- `vercel.json` com `rewrites: [{ "source": "/(.*)", "destination": "/index.html" }]`; arquivos estáticos (incluindo `mockServiceWorker.js`) têm precedência no roteamento da Vercel.
- Header `Service-Worker-Allowed: /` e `Cache-Control: no-cache` para `mockServiceWorker.js`; assets com hash `immutable`.
- Deploy de produção a partir da branch principal; o commit publicado é registrado no README.

## Consequências

- Sem backend; nenhuma variável secreta.

## Alternativas consideradas

- Netlify / Cloudflare Pages — equivalentes; Vercel é a recomendação do enunciado.
