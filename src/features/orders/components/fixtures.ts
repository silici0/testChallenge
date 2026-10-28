import type { Order } from '@/contracts'

export const sampleOrder: Order = {
  id: 'ord_000001',
  version: 2,
  status: 'confirmed',
  createdAt: '2026-07-29T15:30:00.000Z',
  updatedAt: '2026-07-29T15:30:03.000Z',
  declineReason: null,
  receipt: {
    items: [
      {
        nftId: 'nft_emerald-ape-042',
        editionId: 'ed_1',
        name: 'Emerald Ape #042',
        tokenId: '#0042',
        editionLabel: '1/50',
        image: { url: '/images/nfts/nft-01.webp', alt: 'Emerald Ape #042', width: 1024, height: 1024 },
        quantity: 2,
        unitPriceEth: '1.19',
        lineTotalEth: '2.38',
      },
    ],
    subtotalEth: '2.38',
    discountEth: '0',
    networkFeeEth: '0.016',
    totalEth: '2.396',
    coupon: null,
    network: 'ethereum',
    walletAddress: '0xA91F2c3b4D5e6F708192a3B4c5D6e7F80912E82C',
  },
  transaction: {
    hash: '0xa91f0000000000000000000000000000000000000000000000000000000e82c',
    explorerUrl: '/explorer/tx/0xa91f',
    simulated: true,
  },
}
