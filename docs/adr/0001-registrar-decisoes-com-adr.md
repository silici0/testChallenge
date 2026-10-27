# ADR-0001: Registrar decisões arquiteturais com ADRs

- **Status:** Aceita
- **Data:** 2026-10-27
- **Requisitos do enunciado:** §11 (Arquitetura e documentação), §12

## Contexto

O enunciado avalia arquitetura e documentação, exige `ARCHITECTURE.md` com limitações, decisões de UX e desvios do Figma, e deixa a critério do candidato build, organização e bibliotecas complementares. Essas escolhas precisam ser rastreáveis.

## Decisão

- Cada decisão com impacto em mais de um módulo ou que interprete o enunciado vira um ADR em `docs/adr/NNNN-titulo.md`, no formato de `0000-template.md`, citando a seção do enunciado atendida.
- ADRs são imutáveis após aceitos; mudanças geram novo ADR que substitui o anterior.
- `ARCHITECTURE.md` resume e aponta para os ADRs; `docs/requirements-traceability.md` liga requisito → ADR/doc → teste.

## Consequências

- Avaliador encontra a justificativa de cada escolha.
- Custo pequeno de manutenção a cada decisão nova.

## Alternativas consideradas

- Apenas `ARCHITECTURE.md` — mistura decisões com descrição e perde histórico.
