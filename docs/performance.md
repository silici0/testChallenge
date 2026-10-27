# Performance e Lighthouse

Decisão: [ADR-0015](adr/0015-lighthouse-ci-com-mediana.md).

## Protocolo

| Item                    | Valor                                                                                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Build                   | `pnpm build` (produção, `VITE_ENABLE_MOCKS=true`, cenário `default`) servido por `pnpm preview`                                                |
| Páginas                 | Início (`/`) e Detalhe (`/nfts/<id fixo de fixture>`)                                                                                          |
| Perfis                  | `mobile` (padrão Lighthouse: Moto G Power, 4G lento simulado, CPU 4×) e `desktop` (preset `desktop`)                                           |
| Execuções               | 3 por página e perfil (`numberOfRuns: 3`)                                                                                                      |
| Agregação               | Mediana de cada categoria e de LCP, CLS, TBT                                                                                                   |
| Configuração versionada | `lighthouse/lighthouserc.mobile.cjs`, `lighthouse/lighthouserc.desktop.cjs`                                                                    |
| Ferramenta              | `@lhci/cli` (versão fixada no lockfile) com Chrome do Playwright                                                                               |
| Saída                   | `docs/performance/reports/<AAAA-MM-DD>/{mobile,desktop}/` com HTML e JSON por execução, mais `summary.md` gerado por `lighthouse/summarize.ts` |

A auditoria carrega as mesmas imagens, fontes, MSW e Socket.IO da entrega. Não há flags ou builds exclusivos para pontuação.

## Metas

| Categoria      | Meta |
| -------------- | ---: |
| Performance    | ≥ 90 |
| Accessibility  | ≥ 95 |
| Best Practices | ≥ 95 |
| SEO            | ≥ 90 |

## Resultados

_Preencher a partir de `summary.md` após a primeira auditoria._

| Página  | Perfil  | Perf. | A11y |  BP | SEO | LCP | CLS | TBT |
| ------- | ------- | ----: | ---: | --: | --: | --: | --: | --: |
| Início  | mobile  |     — |    — |   — |   — |   — |   — |   — |
| Início  | desktop |     — |    — |   — |   — |   — |   — |   — |
| Detalhe | mobile  |     — |    — |   — |   — |   — |   — |   — |
| Detalhe | desktop |     — |    — |   — |   — |   — |   — |   — |

### Ambiente da medição

| Item              | Valor                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------- |
| Data              | —                                                                                     |
| Lighthouse / LHCI | —                                                                                     |
| Chrome            | —                                                                                     |
| Node / pnpm       | —                                                                                     |
| SO / CPU / RAM    | —                                                                                     |
| Condições         | máquina dedicada, sem outras cargas, rede local (throttling simulado pelo Lighthouse) |

### Resultados abaixo da meta

_Justificar cada categoria abaixo da meta, com causa identificada (ex.: registro do Service Worker do MSW no caminho crítico)._

## Medidas planejadas

- Code splitting por rota (TanStack Router `autoCodeSplitting`) e import dinâmico dos mocks.
- Imagem LCP do destaque com `fetchpriority="high"`, `width`/`height` explícitos, formatos AVIF/WebP com `srcset`.
- Fontes locais `woff2` com `font-display: swap` e preload da fonte principal; métricas de fallback ajustadas (`size-adjust`) para evitar CLS.
- Skeletons com as dimensões finais (CLS ≈ 0).
- `<title>`, `meta description`, `lang="pt-BR"`, `robots.txt` e links rastreáveis (`<a href>`) para SEO.
- Sem erros no console no cenário padrão (Best Practices).
