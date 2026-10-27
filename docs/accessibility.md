# Acessibilidade

Alvo: WCAG 2.2 AA. Verificação: `eslint-plugin-jsx-a11y`, `@axe-core/playwright` (spec 11) e Lighthouse Accessibility ≥ 95.

## Requisitos do enunciado (§8)

| Requisito                                  | Implementação                                                                                                                                                                  |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Navegação por teclado e foco visível       | Ordem DOM = ordem visual; `:focus-visible` com anel de 2 px e contraste ≥ 3:1 em todos os temas; skip link “Ir para o conteúdo”                                                |
| Foco em diálogos e drawers                 | Primitivas Radix (shadcn/ui `Dialog`, `Sheet`): trap de foco, `Esc` fecha, foco retorna ao gatilho; filtros mobile e carrinho em drawer                                        |
| Semântica, labels e erros associados       | Landmarks (`header`, `nav`, `main`, `footer`); um `h1` por página; `label` explícito; erros com `aria-invalid` + `aria-describedby`; foco no primeiro campo inválido ao enviar |
| Alternativas textuais                      | `alt` vindo do contrato (`image.alt`) para NFTs; ícones decorativos com `aria-hidden`; botões só com ícone têm `aria-label` (“Adicionar aos favoritos”) e `aria-pressed`       |
| Contraste e estados não dependentes de cor | Tokens verificados ≥ 4.5:1 (texto) / 3:1 (UI); estados (esgotado, preço alterado, erro, selecionado) sempre com texto e/ou ícone                                               |
| Feedback acessível                         | `LiveAnnouncer` global com regiões `polite` (mutations, tempo real) e `assertive` (erros bloqueantes, sessão expirada); toasts não roubam foco                                 |
| Overflow e zoom                            | Layout fluido até 320 px; sem `overflow-x` na página; testes a 200 % e 400 % de zoom (reflow); valores ETH longos quebram com `overflow-wrap: anywhere`                        |
| Movimento reduzido                         | Shimmer e transições desativados com `prefers-reduced-motion: reduce` (skeleton estático)                                                                                      |

## Componentes críticos

| Componente            | Padrão                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| Busca                 | `role="search"`, `label` visível ou `sr-only`, contagem de resultados anunciada (“24 resultados”) |
| Filtros               | `fieldset`/`legend`, checkboxes nativos (Radix), botão “Limpar filtros”                           |
| Paginação             | `nav aria-label="Paginação"`, `aria-current="page"`                                               |
| Galeria               | Miniaturas como botões com `aria-label="Imagem 2 de 4"`; imagem principal com `alt`               |
| Stepper de quantidade | `input type="number"` com botões −/+, `aria-describedby` para o limite                            |
| Etapas do checkout    | `ol` com `aria-current="step"`; foco vai para o título da etapa ao avançar                        |
| Skeleton              | Container com `aria-busy="true"` e texto `sr-only` “Carregando…”                                  |

## Ajustes em relação ao Figma

Registrar toda alteração visual feita por acessibilidade.

| Elemento                 | Figma                                                                              | Ajuste                                                                                                             | Motivo                             |
| ------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| Modais de login/cadastro | Sem backdrop                                                                       | Overlay preto a 60 %, foco preso, `Esc`                                                                            | Foco e contraste (comentário #58)  |
| Line-height              | Menor que o tamanho da fonte em vários estilos                                     | ≥ 1.2                                                                                                              | WCAG 1.4.12 (espaçamento de texto) |
| Selos (Tiny 9 px)        | 9 px                                                                               | 11 px                                                                                                              | Legibilidade                       |
| Texto de erro            | `color/error` `#ed1b2e`: 4.39:1 sobre `ink`, 4.00:1 sobre `surface-card` (reprova) | Texto de erro em `text-coral` `#f0805f` (7.29:1) com ícone; `#ed1b2e` só em bordas e ícones (≥ 3:1)                | WCAG 1.4.3                         |
| Placeholder              | `text-muted` `#b0916a`: 5.43:1 sobre `surface-raised`                              | Mantido                                                                                                            | Aprovado                           |
| Bordas de campos         | `border` `#3f2319`: 1.34:1 sobre `ink`; `border-soft` 1.42:1                       | Bordas de inputs, checkboxes e stepper em `secondary` `#b39463` (≥ 3:1); `border` fica só em divisores decorativos | WCAG 1.4.11 (componentes de UI)    |
| Foco                     | —                                                                                  | Anel `primary` `#d28a4c` (6.85:1 sobre `ink`), 2 px com offset                                                     | WCAG 2.4.7 / 2.4.13                |
| Stepper                  | “−” ativo no mínimo                                                                | `disabled` + texto do limite                                                                                       | Comentário #10                     |
| Filtros                  | Seleção pouco evidente                                                             | Checkboxes nativos com estado visível, não só por cor                                                              | WCAG 1.4.1 (comentário #4)         |
| Slider de preço          | Só arraste                                                                         | Campos numéricos mín./máx. + teclado nas alças                                                                     | WCAG 2.1.1 e 2.5.7 (comentário #5) |
| Ícones W/C/D             | Letras sem significado                                                             | Ícones decorativos (`aria-hidden`) + texto                                                                         | Comentário #17                     |
| Ações fora do escopo     | Botões ativos                                                                      | `aria-disabled` + dica                                                                                             | Não aparentar sucesso (§3)         |
