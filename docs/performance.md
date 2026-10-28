# Performance e Lighthouse

Decisão: [ADR-0015](adr/0015-lighthouse-ci-com-mediana.md).

## Protocolo

| Item                    | Valor                                                                                                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build                   | `pnpm build` (produção, `VITE_ENABLE_MOCKS=true`, cenário `default`) servido por `pnpm preview`                                                                         |
| Páginas                 | Início (`/`) e Detalhe (`/nfts/<id fixo de fixture>`)                                                                                                                   |
| Perfis                  | `mobile` (padrão Lighthouse: Moto G Power, 4G lento simulado, CPU 4×) e `desktop` (preset `desktop`)                                                                    |
| Execuções               | 3 por página e perfil (`numberOfRuns: 3`)                                                                                                                               |
| Agregação               | Mediana de cada categoria e de LCP, CLS, TBT                                                                                                                            |
| Configuração versionada | `lighthouse/lighthouserc.mobile.cjs`, `lighthouse/lighthouserc.desktop.cjs`                                                                                             |
| Ferramenta              | `@lhci/cli` (versão fixada no lockfile) com Chrome do Playwright                                                                                                        |
| Saída                   | `docs/performance/reports/<AAAA-MM-DD>/{mobile,desktop}/` com HTML e JSON por execução (artefato da CI) e `summary.md` versionado, gerado por `lighthouse/summarize.ts` |

A auditoria carrega as mesmas imagens, fontes, MSW e Socket.IO da entrega. Não há flags ou builds exclusivos para pontuação.

## Metas

| Categoria      | Meta |
| -------------- | ---: |
| Performance    | ≥ 90 |
| Accessibility  | ≥ 95 |
| Best Practices | ≥ 95 |
| SEO            | ≥ 90 |

## Resultados

Medição de 2026-10-28 com as telas reais. Mediana de 3 execuções. O resumo completo está em [`reports/2026-10-28/summary.md`](performance/reports/2026-10-28/summary.md).

| Página  | Perfil  | Perf. | A11y |  BP | SEO |    LCP |   CLS |    TBT |
| ------- | ------- | ----: | ---: | --: | --: | -----: | ----: | -----: |
| Início  | mobile  |    90 |  100 | 100 | 100 | 3,28 s | 0,000 | 128 ms |
| Início  | desktop |    98 |  100 | 100 | 100 | 1,01 s | 0,028 |   0 ms |
| Detalhe | mobile  |    90 |  100 | 100 | 100 | 3,24 s | 0,000 | 119 ms |
| Detalhe | desktop |    99 |  100 | 100 | 100 | 0,91 s | 0,034 |   0 ms |

### Ambiente da medição

| Item              | Valor                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------- |
| Data              | 2026-10-28                                                                            |
| Lighthouse / LHCI | Lighthouse 12.6.1 via `@lhci/cli`                                                     |
| Chrome            | HeadlessChrome 156 (Chromium do Playwright 1.64.1)                                    |
| Node / pnpm       | Node 24.11.1 / pnpm (versão do `packageManager`)                                      |
| SO / CPU / RAM    | Linux 7.2.6 (CachyOS) / Intel i5-10400F × 12 / 31 GB; benchmark index 2096            |
| Condições         | máquina dedicada, sem outras cargas, rede local (throttling simulado pelo Lighthouse) |

### Leitura dos resultados

- Todas as categorias atingem a meta. A Performance no mobile fica **exatamente em 90**, sem folga.
- **LCP no mobile (≈ 3,2 s):** o elemento de LCP é a imagem do primeiro card do catálogo, que já usa `fetchpriority="high"`, `srcset` em WebP e dimensões explícitas. As fases medidas foram TTFB de 486 ms, _load delay_ de 2,5 s, carregamento de 175 ms e renderização de 119 ms. O atraso está no _load delay_: a URL da imagem só existe depois que o Service Worker do MSW registra e a API simulada responde. Com uma API real, o HTML poderia trazer a URL (SSR ou `preload` do primeiro destaque), mas um `preload` fixo no build trataria o catálogo como estático. A decisão foi não fazer isso.
- **JS não utilizado (≈ 70 KiB):** é o chunk do MSW e do binding de Socket.IO, carregado na inicialização por exigência do enunciado (mock no navegador).
- **A11y:** a primeira medição deu 96 na Início por causa do tamanho de alvo (WCAG 2.5.8). Os indicadores do carrossel tinham 12×12 px e agora têm área de toque de 24×24 px, com o mesmo ponto visual de 12 px.
- **CLS no desktop (0,03):** abaixo de 0,1. O caso com rede lenta é coberto por `carregamento-e-erros.feature`.

### Relatórios

Só o `summary.md` de cada medição é versionado. Os HTML e JSON por execução somam cerca de 17 MB por medição. Eles ficam fora do git (`.gitignore`) e são publicados como artefato do job `lighthouse` da CI.

## Medidas planejadas

- Code splitting por rota (TanStack Router `autoCodeSplitting`) e import dinâmico dos mocks.
- Imagem LCP do destaque com `fetchpriority="high"`, `width`/`height` explícitos, formatos AVIF/WebP com `srcset`.
- Fontes locais `woff2` com `font-display: swap` e preload da fonte principal; métricas de fallback ajustadas (`size-adjust`) para evitar CLS.
- Skeletons com as dimensões finais (CLS ≈ 0). O cenário `carregamento-e-erros.feature` mede o CLS com `slow-network`. Ele detectou 0,11 na Início porque os indicadores do carrossel apareciam só depois dos destaques; agora a linha fica reservada durante o carregamento.
- `<title>`, `meta description`, `lang="pt-BR"`, `robots.txt` e links rastreáveis (`<a href>`) para SEO.
- Sem erros no console no cenário padrão (Best Practices).
