# Design tokens

Fonte: coleção de variáveis **Design Tokens** do Figma, com 30 estilos de cor e 59 estilos de texto. Os valores brutos estão em [`tokens.json`](tokens.json). Os nomes abaixo serão os tokens do Tailwind (`@theme`) em `src/styles/theme.css` ([ADR-0013](../adr/0013-tailwind-v4-e-shadcn-com-tokens-do-figma.md)).

## Cores

| Token Figma                                                    | Hex                                     | Uso observado                      | Mapeamento shadcn/ui         |
| -------------------------------------------------------------- | --------------------------------------- | ---------------------------------- | ---------------------------- |
| `color/ink`                                                    | `#140d0a`                               | Fundo da página (152 usos)         | `--background`               |
| `color/ink-soft`                                               | `#1c110c`                               | Fundo alternativo                  | —                            |
| `color/ink-deep`                                               | `#0e0907`                               | Sombras, overlay                   | —                            |
| `color/surface-card`                                           | `#241612`                               | Cards, painéis                     | `--card`, `--popover`        |
| `color/surface-raised`                                         | `#2f1d15`                               | Inputs, áreas elevadas             | `--input` (fundo), `--muted` |
| `color/surface-dark`                                           | `#38220f`                               | Blocos de destaque                 | `--accent`                   |
| `color/border`                                                 | `#3f2319`                               | Bordas (112 usos)                  | `--border`                   |
| `color/border-soft`                                            | `#55321f`                               | Bordas suaves, divisores           | —                            |
| `color/primary`                                                | `#d28a4c`                               | CTA, links, destaques (284 usos)   | `--primary`, `--ring`        |
| `color/primary-light`                                          | `#dd9a5f`                               | Hover                              | —                            |
| `color/primary-dark`                                           | `#c47b3e`                               | Pressed                            | —                            |
| `color/amber`                                                  | `#e3a44e`                               | Selos (“RARO”)                     | —                            |
| `color/secondary`                                              | `#b39463`                               | Texto e ícones secundários         | `--secondary-foreground`     |
| `color/foreground`                                             | `#f5f1eb`                               | Texto principal (438 usos)         | `--foreground`               |
| `color/text-primary`                                           | `#f7f3ec`                               | Texto principal (variação)         | —                            |
| `color/text-secondary`                                         | `#cfb28c`                               | Texto secundário                   | `--muted-foreground`         |
| `color/text-muted`                                             | `#b0916a`                               | Placeholder, legendas              | —                            |
| `color/text-accent`                                            | `#e89b55`                               | Preços, valores                    | —                            |
| `color/text-coral`                                             | `#f0805f`                               | Avisos, descontos                  | —                            |
| `color/success`                                                | `#00a66c`                               | Sucesso                            | `--success`                  |
| `color/error`                                                  | `#ed1b2e`                               | Erro                               | `--destructive`              |
| `color/white` · `black` · `gray-light` · `background-elevated` | `#fff` · `#000` · `#ededed` · `#fbfbfb` | Botões sociais, logos              | —                            |
| `logo/*`                                                       | ver JSON                                | Marcas Google, Facebook, carteiras | —                            |

Há apenas tema escuro (comentário #9). **Decisão:** entregar só o tema escuro, conforme o Figma, com `color-scheme: dark`. O enunciado não pede tema claro.

### Contraste (WCAG 2.2 AA), medido

| Par                               | Uso                                        | Razão | Resultado                        |
| --------------------------------- | ------------------------------------------ | ----: | -------------------------------- |
| `foreground` / `ink`              | Texto principal                            | 17.10 | ✅                               |
| `text-secondary` / `surface-card` | Texto secundário                           |  8.68 | ✅                               |
| `text-accent` / `surface-card`    | Preços                                     |  7.72 | ✅                               |
| `secondary` / `surface-card`      | Ícones e texto secundário                  |  6.12 | ✅                               |
| `text-muted` / `surface-raised`   | Placeholder                                |  5.43 | ✅                               |
| `ink` / `primary`                 | Texto dos botões primários (como no Figma) |  6.85 | ✅                               |
| `foreground` / `primary`          | —                                          |  2.50 | ❌ não usar                      |
| `error` / `ink`                   | Texto de erro                              |  4.39 | ❌ usar `text-coral` (7.29)      |
| `error` / `surface-card`          | Texto de erro                              |  4.00 | ❌ usar `text-coral`             |
| `border` / `ink`                  | Bordas                                     |  1.34 | ❌ para campos; usar `secondary` |
| `border-soft` / `surface-raised`  | Bordas                                     |  1.42 | ❌ para campos; usar `secondary` |

Os ajustes estão em [`../accessibility.md`](../accessibility.md#ajustes-em-relação-ao-figma).

## Tipografia

Família única: **Roboto Mono** (Light 300, Regular 400, Medium 500, Bold 700).

O Figma define 59 estilos de texto, muitos redundantes (mesmo tamanho com line-heights diferentes, como 15/15, 15/16, 15/40 e 15/45). A implementação consolida tudo nesta escala:

| Token        | Tamanho / altura de linha | Peso                                  | Origem no Figma        |
| ------------ | ------------------------- | ------------------------------------- | ---------------------- |
| `display`    | 43 / 70                   | 700                                   | Display/43 Bold (hero) |
| `display-sm` | 32 / auto, tracking 10 %  | 700                                   | Display/32 Bold        |
| `h1`         | 28 / auto                 | 700                                   | Heading/28 Bold        |
| `h2`         | 24 / 32                   | 700                                   | Heading/24 e 26 Bold   |
| `h3`         | 22 / 29                   | 400 e 700                             | Title/22               |
| `title`      | 20 / 28                   | 400, 500 e 700                        | Title/20 e 21          |
| `body-lg`    | 18 / 24                   | 400, 500 e 700                        | Body Large/18 e 19     |
| `body`       | 16 / 22                   | 400, 500 e 700                        | Body Large/16 e 17     |
| `body-sm`    | 15 / 22                   | 400 e 700                             | Body/15                |
| `label`      | 14 / 20                   | 400, 500 e 700; tracking 10 % em CTAs | Body/14                |
| `caption`    | 13 / 16                   | 400 e 500                             | Caption/13             |
| `caption-sm` | 12 / 16                   | 400 e 700                             | Caption/12             |
| `tiny`       | 10–11 / 16                | 500                                   | Tiny/10 e 11           |

O estilo Tiny/9 Bold (selos) sobe para 11 px por legibilidade. Line-heights menores que o tamanho da fonte (por exemplo, 17/16 e 18/16) são normalizados para ≥ 1.2. Essas duas mudanças estão registradas como desvios.

## Raios

Valores mais usados: 3, 4, 6, 8, 16 e 37 (pill). Outros valores (5, 10, 13, 14, 15, 17, 20, 29…) aparecem de forma isolada e são arredondados para a escala mais próxima.

| Token         | px                       |
| ------------- | ------------------------ |
| `radius-xs`   | 3                        |
| `radius-sm`   | 4 (paginação, inputs)    |
| `radius-md`   | 6                        |
| `radius-lg`   | 8                        |
| `radius-xl`   | 16 (cards)               |
| `radius-pill` | 37 (botões arredondados) |

## Sombras

| Token            | Valor                                 |
| ---------------- | ------------------------------------- |
| `shadow-glow-sm` | `0 0 20px rgb(10 6 4 / .45)`          |
| `shadow-glow-md` | `0 6px 20px rgb(10 6 4 / .45)`        |
| `shadow-glow-lg` | `0 20px 20px rgb(10 6 4 / .45)`       |
| `shadow-glow-xl` | `0 0 40px rgb(10 6 4 / .45)`          |
| `shadow-card`    | `0 4px 12px -2px rgb(20 13 10 / .15)` |

Os gradientes usados no layout são variações de opacidade de `primary` (`#d28a4c` de 0 a 100 %) e de `surface-card` → `surface-raised`.

## Grid e espaçamento

| Token                 | Valor                                                         |
| --------------------- | ------------------------------------------------------------- |
| Container             | 1200 px (`max-w-[1200px]`), padding lateral de 120 px em 1440 |
| Gap entre seções      | 96 px                                                         |
| Sidebar de filtros    | 310 px, gap de 48 px até o grid                               |
| Grid de produtos      | 842 px, 3 colunas, gap vertical entre linhas de 72 px         |
| Paginação             | botões de 35 × 35, gap 8, raio 4                              |
| Escala de espaçamento | 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 72, 88, 96              |
| Bordas                | 1 px (padrão) e 1.5 px (inputs/cards)                         |
