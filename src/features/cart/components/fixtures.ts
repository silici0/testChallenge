import type { Cart, CartItem } from '@/contracts'

type ItemSeed = [
  id: string,
  name: string,
  artwork: string,
  edition: string,
  price: string,
  quantity: number,
  total: string,
]

const item = ([id, name, artwork, edition, price, quantity, total]: ItemSeed): CartItem => ({
  id,
  nftId: `nft_${id}`,
  editionId: `ed_${id}`,
  nft: {
    id: `nft_${id}`,
    name,
    tokenId: `#00${id.slice(-2)}`,
    image: { url: `/images/nfts/${artwork}.webp`, alt: name, width: 1024, height: 1024 },
  },
  editionLabel: edition,
  quantity,
  unitPriceEth: price,
  lineTotalEth: total,
  available: 10,
  maxPerOrder: 10,
})

/** Carrinho de exemplo (Figma: Desktop / Carrinho de NFTs). */
export const sampleCart: Cart = {
  id: 'cart_1',
  ownerType: 'user',
  version: 3,
  items: [
    item(['item_42', 'Emerald Ape #042', 'nft-01', '1/50', '1.19', 2, '2.38']),
    item(['item_14', 'Violet Nomad #314', 'nft-02', '1/10', '1.39', 6, '8.34']),
    item(['item_88', 'Ivory Baron #088', 'nft-03', '1/50', '1.79', 9, '16.11']),
  ],
  couponCode: null,
  summary: { subtotalEth: '26.83', discountEth: '0', networkFeeEth: '0.016', totalEth: '26.846', coupon: null },
  issues: [],
}
