import type { NftSummary } from '@/contracts'

/** Dados estáticos para stories e testes de componentes (espelham o contrato). */
export const sampleNfts: NftSummary[] = [
  ['nft_emerald-ape-042', 'Emerald Ape #042', 'nft-01', '1.19', 'rare', 12],
  ['nft_sage-nomad-009', 'Sage Nomad #009', 'nft-02', '1.69', null, 4],
  ['nft_neon-vessel-552', 'Neon Vessel #552', 'nft-03', '1.99', null, 0],
  ['nft_golden-beat-207', 'Golden Beat #207', 'nft-04', '0.99', null, 30],
].map(([id, name, artwork, price, badge, available]) => ({
  id: id as string,
  name: name as string,
  collection: { id: 'col_kurio-apes', name: 'Kurio Apes' },
  creator: { id: 'cr_nova-sato', name: 'Nova Sato' },
  image: {
    url: `/images/nfts/${artwork as string}.webp`,
    alt: `${name as string}: ilustração de primata colecionável`,
    width: 1024,
    height: 1024,
  },
  category: 'arte-digital',
  network: 'ethereum',
  badge: badge as 'rare' | null,
  priceFromEth: price as string,
  available: available as number,
  version: 1,
}))
