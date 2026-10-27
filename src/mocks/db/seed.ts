import { addEth, multiplyEth } from '@/shared/lib/money'

import { createNftFixtures } from '../fixtures/nfts'
import { createCouponFixtures, createUserFixtures, createWalletFixtures } from '../fixtures/users'
import type { DbState, OrderRecord } from './schema'

const HISTORY_DATE = '2026-07-29T15:30:00.000Z'

function historicalOrder(state: Pick<DbState, 'nfts'>): OrderRecord {
  const nft = state.nfts[0]
  const edition = nft?.editions[2]
  if (!nft || !edition) throw new Error('Fixtures de NFT incompletas')
  return {
    id: 'ord_seed-ana-1',
    userId: 'usr_ana',
    version: 2,
    status: 'confirmed',
    createdAt: HISTORY_DATE,
    updatedAt: HISTORY_DATE,
    declineReason: null,
    receipt: {
      items: [
        {
          nftId: nft.id,
          editionId: edition.id,
          name: nft.name,
          tokenId: nft.tokenId,
          editionLabel: edition.label,
          image: nft.image,
          quantity: 2,
          unitPriceEth: edition.priceEth,
          lineTotalEth: multiplyEth(edition.priceEth, 2),
        },
      ],
      subtotalEth: multiplyEth(edition.priceEth, 2),
      discountEth: '0',
      networkFeeEth: '0.016',
      totalEth: addEth(multiplyEth(edition.priceEth, 2), '0.016'),
      coupon: null,
      network: 'ethereum',
      walletAddress: '0xA91F2c3b4D5e6F708192a3B4c5D6e7F80912E82C',
    },
    transaction: {
      hash: '0xa91f000000000000000000000000000000000000000000000000000000e82c',
      explorerUrl: '/explorer/tx/0xa91f',
      simulated: true,
    },
    resolution: null,
  }
}

/** Estado inicial conhecido (cenário `default`): reset restaura exatamente isto. */
export async function createSeedState(): Promise<DbState> {
  const nfts = createNftFixtures()
  const order = historicalOrder({ nfts })
  return {
    schemaVersion: 1,
    counters: {},
    nfts,
    users: await createUserFixtures(),
    sessions: [],
    favorites: { usr_ana: [1, 4, 7].flatMap((index) => nfts[index]?.id ?? []) },
    carts: [],
    coupons: createCouponFixtures(),
    quotes: [],
    orders: [order],
    idempotency: [],
    wallets: createWalletFixtures(),
  }
}
