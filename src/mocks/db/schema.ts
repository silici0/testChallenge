import type { Category, Edition, Image, Network, OrderStatus, Receipt } from '@/contracts'

/**
 * Estado do “servidor” simulado. Serializável em JSON (persistido em localStorage).
 * Os tipos de transporte (contracts) são montados a partir deste estado pelas funções de domínio.
 */

export interface NftRecord {
  id: string
  name: string
  tokenId: string
  collection: { id: string; name: string }
  creator: { id: string; name: string }
  image: Image
  gallery: Image[]
  category: Category
  network: Network
  badge: 'rare' | null
  description: string
  longDescription: string
  attributes: { trait: string; value: string }[]
  rating: { average: number; count: number }
  reviews: { author: string; rating: number; text: string; createdAt: string }[]
  contract: { address: string; standard: 'ERC-721' | 'ERC-1155' | 'SPL' }
  royaltyPercent: number
  editions: Edition[]
  popularity: number
  createdAt: string
  version: number
}

export interface UserRecord {
  id: string
  displayName: string
  username: string
  email: string
  passwordHash: string
  passwordSalt: string
  ensName: string | null
  walletNickname: string | null
  avatarUrl: string | null
  version: number
}

export interface SessionRecord {
  token: string
  userId: string
  expiresAt: string
}

export interface CartItemRecord {
  id: string
  nftId: string
  editionId: string
  quantity: number
  /** Preço visto pelo usuário na última leitura — base para detectar PRICE_CHANGED. */
  seenPriceEth: string
}

export interface CartRecord {
  id: string
  ownerType: 'guest' | 'user'
  ownerId: string
  items: CartItemRecord[]
  couponCode: string | null
  version: number
}

export interface CouponRecord {
  code: string
  basisPoints: number
  minSubtotalEth: string
  expiresAt: string
  description: string
}

export interface QuoteRecord {
  id: string
  userId: string
  cartId: string
  cartVersion: number
  network: Network
  items: {
    itemId: string
    nftId: string
    editionId: string
    quantity: number
    unitPriceEth: string
    lineTotalEth: string
  }[]
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
  couponCode: string | null
  expiresAt: string
}

export interface OrderRecord {
  id: string
  userId: string
  version: number
  status: OrderStatus
  createdAt: string
  updatedAt: string
  declineReason: string | null
  receipt: Receipt
  transaction: { hash: string; explorerUrl: string; simulated: true } | null
  /** Agendamento da resolução simulada (sobrevive a refresh). */
  resolution: { status: 'confirmed' | 'declined'; at: string; reason: string | null } | null
}

export interface IdempotencyRecord {
  key: string
  userId: string
  bodyHash: string
  orderId: string
}

export interface WalletRecord {
  id: string
  userId: string
  role: 'primary' | 'secondary'
  displayName: string
  nickname: string | null
  network: Network
  address: string
  provider: 'metamask' | 'walletconnect' | 'coinbase'
  ensName: string | null
  connection: 'disconnected' | 'connected'
  version: number
}

export interface DbState {
  schemaVersion: 1
  counters: Record<string, number>
  nfts: NftRecord[]
  users: UserRecord[]
  sessions: SessionRecord[]
  favorites: Record<string, string[]>
  carts: CartRecord[]
  coupons: CouponRecord[]
  quotes: QuoteRecord[]
  orders: OrderRecord[]
  idempotency: IdempotencyRecord[]
  wallets: WalletRecord[]
}
