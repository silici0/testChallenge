# ADR-0015: Lighthouse via @lhci/cli com 3 execuções e mediana

- **Status:** Aceita
- **Data:** 2026-10-27
- **Requisitos do enunciado:** §10

## Contexto

Auditar Início e Detalhe em mobile e desktop, build otimizado, cenário padrão, 3 medições com mediana, configuração versionada, relatórios HTML/JSON, versões, ambiente e LCP/CLS/TBT.

## Decisão

- `@lhci/cli` com `lighthouserc.mobile.cjs` e `lighthouserc.desktop.cjs` (`numberOfRuns: 3`, `startServerCommand: pnpm preview`).
- Upload `filesystem` para `docs/performance/reports/<data>/<perfil>/`.
- `lighthouse/summarize.ts` lê os JSON, calcula medianas por categoria e de LCP/CLS/TBT e escreve `summary.md` com versões (Lighthouse, Chrome, Node) e ambiente.
- Assertions de LHCI com as metas como `warn` (o relatório deve registrar e justificar resultados abaixo, não esconder).

## Consequências

- Relatórios versionados aumentam o repositório; apenas a última auditoria é mantida.

## Alternativas consideradas

- Script próprio com `lighthouse` programático — LHCI já resolve execução múltipla e servidor.
