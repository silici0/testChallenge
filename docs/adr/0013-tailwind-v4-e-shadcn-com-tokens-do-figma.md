# ADR-0013: Tailwind CSS v4 e shadcn/ui com tokens do Figma

- **Status:** Aceita
- **Data:** 2026-10-27
- **Requisitos do enunciado:** §2, §8 (fidelidade visual, adaptar shadcn/ui à identidade)

## Contexto

O Figma define tipografia, cores, espaçamentos e composição. shadcn/ui fornece primitivas acessíveis (Radix) que precisam assumir a identidade do projeto.

## Decisão

- Tailwind v4 com `@theme` em `src/styles/theme.css` contendo tokens extraídos do Figma (cores, fontes, raios, sombras, espaçamentos, breakpoints).
- Componentes shadcn/ui gerados em `src/shared/ui/` e editados para usar apenas tokens; variantes via `cva`.
- Fontes e imagens do Figma servidas localmente.
- Skeleton com shimmer em CSS (`@keyframes`) desativado por `motion-reduce:`.
- Desvios do Figma registrados em `ARCHITECTURE.md` §7.

## Consequências

- Mudanças de identidade concentradas nos tokens.

## Alternativas consideradas

- CSS Modules / styled-components — fora da stack obrigatória.
