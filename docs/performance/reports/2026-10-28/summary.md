# Lighthouse — 2026-10-28

Mediana de 2 perfis × páginas, 3 execuções cada. Metas: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90.

| Página                    | Perfil  | Execuções | Performance | Accessibility | Best Practices | SEO |    LCP |   CLS |    TBT |
| ------------------------- | ------- | --------: | ----------: | ------------: | -------------: | --: | -----: | ----: | -----: |
| /                         | mobile  |         3 |          90 |           100 |            100 | 100 | 3.28 s | 0.000 | 128 ms |
| /nfts/nft_emerald-ape-042 | mobile  |         3 |          90 |           100 |            100 | 100 | 3.24 s | 0.000 | 119 ms |
| /                         | desktop |         3 |          98 |           100 |            100 | 100 | 1.01 s | 0.028 |   0 ms |
| /nfts/nft_emerald-ape-042 | desktop |         3 |          99 |           100 |            100 | 100 | 0.91 s | 0.034 |   0 ms |

## Ambiente

| Item            | Valor                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| Lighthouse      | 12.6.1                                                                                                        |
| Navegador       | Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/156.0.0.0 Safari/537.36 |
| Benchmark index | 2133.5                                                                                                        |
| Throttling      | simulate                                                                                                      |
| Node            | v24.11.1                                                                                                      |
| SO              | Linux 7.2.6-1-cachyos (x64)                                                                                   |
| CPU             | Intel(R) Core(TM) i5-10400F CPU @ 2.90GHz × 12                                                                |
| RAM             | 31 GB                                                                                                         |
| Build           | `pnpm build` com `VITE_ENABLE_MOCKS=true`, cenário `default`, servido por `pnpm preview`                      |
