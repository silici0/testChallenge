# ADR-0017: Formulários com React Hook Form + Zod

- **Status:** Aceita
- **Data:** 2026-10-27
- **Requisitos do enunciado:** §3.3, §3.4 (validação de cadastro, perfil, senha, carteiras, pagamento, erros da API), §8 (erros associados aos campos)

## Contexto

Vários formulários precisam de validação local consistente com a API e de exibição acessível de erros retornados pelo servidor.

## Decisão

- React Hook Form com `zodResolver` usando os schemas de `src/contracts`.
- Componentes `Form*` do shadcn/ui (ligam `aria-invalid`/`aria-describedby`).
- `applyApiErrors(form, apiError)` mapeia `fieldErrors` (422/409) para `setError` e foca o primeiro campo inválido.
- Validação `onBlur` + `onSubmit`; botão de envio com `aria-busy` durante a mutation.

## Consequências

- Mesma regra no cliente e no mock.

## Alternativas consideradas

- TanStack Form — viável; RHF tem integração pronta com shadcn/ui.
