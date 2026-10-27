# ADR-0005: Contratos Zod compartilhados entre mocks e cliente

- **Status:** Aceita
- **Data:** 2026-10-27
- **Requisitos do enunciado:** §4 (contratos tipados entre transporte, estado e interface), §5, §6 (reuso de contratos)

## Contexto

Os mocks precisam produzir exatamente os contratos consumidos, e a UI precisa de tipos confiáveis. Divergência silenciosa entre mock e cliente é um risco real.

## Decisão

- `src/contracts/*.ts` define schemas Zod para requisições, respostas, erros e eventos; tipos via `z.infer`.
- Handlers MSW tipam respostas com esses tipos (`HttpResponse.json<NftDetail>()`) e validam corpos de requisição com os schemas (422 em caso de falha).
- O cliente valida toda resposta com `schema.parse` na função de API da feature; falha vira `ApiError { code: 'CONTRACT_ERROR' }` (não retryable).
- Formulários reutilizam os schemas de requisição.
- `docs/api-contracts.md` é a versão legível; mudanças de contrato atualizam ambos no mesmo commit.

## Consequências

- Uma alteração de contrato quebra o typecheck dos dois lados.
- Custo de parse em runtime é desprezível para os volumes da aplicação.

## Alternativas consideradas

- OpenAPI + geração de código — sobrecarga sem backend real.
- Apenas tipos TS — não detecta divergência em runtime.
