# ADR-0019: Design system endêmico com tokens DTCG e Style Dictionary

- **Status:** Aceita
- **Data:** 2026-10-27
- **Requisitos do enunciado:** §8 (fidelidade visual, shadcn/ui adaptado), §11 (arquitetura)
- **Complementa:** [ADR-0013](0013-tailwind-v4-e-shadcn-com-tokens-do-figma.md)

## Contexto

O Figma tem uma coleção de variáveis “Design Tokens” e 59 estilos de texto com redundâncias. Precisamos de uma fonte única de tokens que alimente o Tailwind, a documentação e o `tailwind-merge`, sem valores mágicos espalhados nos componentes.

## Decisão

- **Fonte:** `tokens/` em formato DTCG (W3C), em duas camadas:
  - `primitive/`: paleta e escalas extraídas do Figma;
  - `semantic/`: papéis usados pelos componentes, como `color.foreground`, `color.border-field` e `color.danger-text`, com a justificativa de contraste em `$description`.
- **Build:** `pnpm tokens:build` (Style Dictionary 5) gera dois arquivos:
  - `src/styles/generated/theme.css`: bloco `@theme` do Tailwind v4, com `--color-*: initial` para impedir o uso da paleta padrão do Tailwind;
  - `src/shared/design-tokens/tokens.generated.ts`: catálogo tipado.
- **Consumo:**
  - componentes usam só utilitários semânticos (`bg-surface`, `text-accent`, `rounded-xl`);
  - o `cn()` estende o `tailwind-merge` com os nomes do catálogo, para que `text-body` não colida com `text-foreground`;
  - o Storybook mostra o dicionário em “Foundations/Design Tokens”.
- **Componentes endêmicos:** ficam em `src/shared/ui/<componente>/`, partindo das primitivas Radix (via shadcn/ui) quando há comportamento complexo, como dialog, tabs e select.
- **Sincronia:** os arquivos gerados são versionados, e o lint-staged os regenera quando `tokens/**` muda.

## Consequências

- Mudar a identidade visual significa editar `tokens/`.
- A paleta primitiva não vira utilitário Tailwind, o que força o uso semântico.
- Correções de contraste (WCAG) ficam em um único lugar.

## Alternativas consideradas

- Tokens escritos à mão no CSS: sem catálogo nem documentação gerada.
- Tokens Studio sincronizado com o Figma: o arquivo é de terceiros (somente leitura).
