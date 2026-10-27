# Figma — inventário e referência

|                   |                                                                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Arquivo oficial   | [Frontend Challenge](https://www.figma.com/design/Ff0SksUi7UFtPWUO8kyNtw/Frontend-Challenge?node-id=0-1) (somente visualização e comentários) |
| Cópia de trabalho | `hgiKpHwrbziWnVCc1TG96R` (drafts do autor, usada para extrair os dados)                                                                       |
| Página            | “Marketplace de NFTs GreenMint”                                                                                                               |
| Marca no layout   | **Kurio** (wordmark “KURIO”)                                                                                                                  |
| Extração          | 2026-10-27, via Plugin API na cópia (2 829 nós)                                                                                               |

Documentos derivados:

- [`tokens.json`](tokens.json) e [`design-tokens.md`](design-tokens.md): cores, tipografia, raios, sombras, grid
- [`screens.md`](screens.md): conteúdo e estrutura de cada tela, lacunas em relação ao enunciado
- [`comments.md`](comments.md): os 62 comentários públicos do arquivo, classificados, com a decisão adotada

## Frames

| Frame                            | Node      | Tamanho     | Rota                                                   |
| -------------------------------- | --------- | ----------- | ------------------------------------------------------ |
| Desktop / Início                 | `2:2`     | 1440 × 3668 | `/`                                                    |
| Desktop / Detalhes do NFT        | `10:244`  | 1440 × 2246 | `/nfts/$nftId`                                         |
| Desktop / Carrinho de NFTs       | `11:1278` | 1440 × 1754 | `/cart`                                                |
| Desktop / Pagamento              | `11:2862` | 1440 × 1657 | `/checkout`                                            |
| Desktop / Confirmação de Pedido  | `11:4385` | 1440 × 1657 | `/orders/$orderId` (modal sobre o pagamento no layout) |
| Desktop / Login                  | `9:115`   | 1440 × 1981 | `/login` (modal sobre a Início no layout)              |
| Desktop / Cadastro               | `9:1022`  | 1440 × 1981 | `/register` (modal sobre a Início no layout)           |
| Desktop / Perfil do Colecionador | `9:1238`  | 1440 × 1080 | `/account/profile`                                     |
| Desktop / Carteiras              | `9:1670`  | 1440 × 1080 | `/account/wallets`                                     |
| Mobile / Início                  | `14:5226` | 414 × 896   | `/`                                                    |
| Mobile / Detalhes do NFT         | `15:5536` | 414 × 896   | `/nfts/$nftId`                                         |
| Mobile / Carrinho de NFTs        | `16:360`  | 414 × 896   | `/cart`                                                |
| Mobile / Pagamento               | `16:748`  | 414 × 896   | `/checkout`                                            |
| Mobile / Login                   | `16:1022` | 414 × 896   | `/login`                                               |
| Mobile / Cadastro                | `16:1228` | 414 × 896   | `/register`                                            |

Sem frames: mobile de Confirmação, Perfil e Carteiras, e nenhum frame de tablet. O enunciado exige que essas telas funcionem em mobile e que sejam avaliadas as larguras de 390, 768 e 1440 px. Os frames mobile têm **414 px**; a implementação valida em 390 px.

## Estrutura de layout (Desktop / Início)

Auto layout vertical, padding lateral 120 px, gap de 96 px entre seções, conteúdo com 1200 px.

```
Top (gap 32)          Header With Divider (1200×45) · Hero (1200×450)
Products (gap 48)     Sidebar 310 (Filters 310×785 · Featured NFT Banner 310×470)
                      Product Grid 842 (Toolbar · Grid Rows gap 72 · Pagination 35×35 gap 8)
Promos (gap 28)       2 cards 586×250
Blog (gap 40)         header + 4 cards (gap 24)
Footer                1200×610
```

## Componentes e instâncias

Componentes reutilizados no arquivo: `Header With Divider`, `Header Row`, `Footer`, `Filters`, `Checkout Page`, `Marketplace Page`, `Password Input`, `Social Button`, `Mobile Social Block`.

Ícones: conjunto **Iconly** (Curved, Bold, Light-Outline, Two-tone): Home, Star, Activity, Arrow Left/Right/Down, Danger Triangle, Delete, Download, Filter, Hide, Image, Logout, Wallet, Location. Também ícones próprios: Search, User, Shop, X, Message, Arrow-Down.

## Assets

| Asset                     | Origem                                                        | Observação                                                                                  |
| ------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Arte dos NFTs             | 4 imagens PNG únicas, 1254 × 1254, ~2 MB cada                 | Reutilizadas em todos os cards (“NFT Artwork 01–18”). Converter para AVIF/WebP com `srcset` |
| Ícones                    | Iconly + ícones locais (vetores)                              | Exportar como SVG                                                                           |
| Logos sociais e carteiras | Vetores (Google, Facebook, MetaMask, WalletConnect, Coinbase) | Exportar como SVG                                                                           |
| Fonte                     | Roboto Mono (Light, Regular, Medium, Bold)                    | Servir localmente em `woff2` (OFL)                                                          |

Os assets ainda precisam ser exportados para `public/` (o download depende de autorização no navegador). Como o fixture exige 60 NFTs e o layout só traz 4 artes, as demais variações serão geradas a partir dessas 4 (recorte, matiz e fundo), o que está registrado como substituição em [`ARCHITECTURE.md`](../../ARCHITECTURE.md#substituição-de-assets).
