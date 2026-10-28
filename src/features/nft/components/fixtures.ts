import type { NftDetail } from '@/contracts'

/** NFT de exemplo (contrato de detalhe) para stories e testes de componentes. */
export const sampleDetail: NftDetail = {
  id: 'nft_emerald-ape-042',
  name: 'Emerald Ape #042',
  tokenId: '#0042',
  collection: { id: 'col_kurio-apes', name: 'Kurio Apes' },
  creator: { id: 'cr_nova-sato', name: 'Nova Sato' },
  image: {
    url: '/images/nfts/nft-01.webp',
    alt: 'Emerald Ape #042: primata com óculos e jaqueta verde',
    width: 1024,
    height: 1024,
  },
  gallery: [1, 2, 3, 4].map((view) => ({
    url: '/images/nfts/nft-01.webp',
    alt: `Emerald Ape #042, vista ${view} de 4`,
    width: 1024,
    height: 1024,
  })),
  category: 'arte-digital',
  network: 'ethereum',
  badge: 'rare',
  priceFromEth: '1.19',
  available: 21,
  version: 1,
  description: 'Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na Ethereum.',
  longDescription: 'Emerald Ape #042 é uma obra digital 1/50 finalizada à mão da coleção Kurio Editions.',
  attributes: [
    { trait: 'Acessório', value: 'Óculos' },
    { trait: 'Paleta', value: 'Esmeralda' },
    { trait: 'Raridade', value: 'Raro' },
  ],
  rating: { average: 4.8, count: 19 },
  reviews: [{ author: 'colecionador.eth', rating: 5, text: 'Arte impecável.', createdAt: '2026-07-26T12:00:00.000Z' }],
  contract: { address: '0x7A420000000000000000000000000000000019E8', standard: 'ERC-721' },
  royaltyPercent: 5,
  editions: [
    { id: 'ed_1-1', label: '1/1', priceEth: '3.57', supply: 1, available: 0, maxPerOrder: 1, status: 'sold-out' },
    { id: 'ed_1-10', label: '1/10', priceEth: '1.785', supply: 10, available: 4, maxPerOrder: 3, status: 'available' },
    { id: 'ed_1-50', label: '1/50', priceEth: '1.19', supply: 50, available: 17, maxPerOrder: 10, status: 'available' },
    {
      id: 'ed_aberta',
      label: 'Aberta',
      priceEth: '0.714',
      supply: null,
      available: 999,
      maxPerOrder: 20,
      status: 'available',
    },
  ],
  createdAt: '2026-07-29T12:00:00.000Z',
}
