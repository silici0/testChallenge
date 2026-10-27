import type { CreateOrderBody, Order, OrderStatus } from '@/contracts'

import { isoIn, isoNow, nextId } from '../db/runtime'
import type { DbState, OrderRecord } from '../db/schema'
import { removePurchased } from './cart'
import { findNft, nftUpdatedEvent } from './catalog'
import { type DomainContext, fail, requireFound } from './context'
import { createQuote, diffQuotes, toQuoteDto } from './quote'

export interface OrderResolutionPlan {
  status: 'confirmed' | 'declined'
  afterMs: number
  reason: string | null
}

/** JSON canônico (chaves ordenadas) para comparar corpos de requisições idempotentes. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b))
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`).join(',')}}`
  }
  return JSON.stringify(value)
}

export const toOrderDto = ({ userId: _userId, resolution: _resolution, ...order }: OrderRecord): Order => order

export function findOwnOrder(db: DbState, userId: string, orderId: string): OrderRecord {
  const order = requireFound(
    db.orders.find((candidate) => candidate.id === orderId),
    'Pedido',
  )
  if (order.userId !== userId) fail('FORBIDDEN', 'Pedido de outro usuário')
  return order
}

function assertWallet(db: DbState, userId: string, body: CreateOrderBody) {
  const wallet = requireFound(
    db.wallets.find((candidate) => candidate.id === body.walletId),
    'Carteira',
  )
  if (wallet.userId !== userId) fail('FORBIDDEN', 'Carteira de outro usuário')
  if (wallet.connection !== 'connected') {
    fail('VALIDATION_ERROR', 'Conecte a carteira antes de confirmar', {
      fieldErrors: { walletId: ['Carteira desconectada'] },
    })
  }
  return wallet
}

/** Revalida a cotação aceita: qualquer divergência exige nova confirmação (409 QUOTE_STALE). */
function revalidateQuote(db: DbState, userId: string, body: CreateOrderBody) {
  const accepted = db.quotes.find((quote) => quote.id === body.quoteId && quote.userId === userId)
  const fresh = createQuote(db, userId, body.network)
  if (!accepted) {
    return fail('QUOTE_STALE', 'Cotação não encontrada; revise o pedido', {
      details: { quote: toQuoteDto(db, fresh), changes: [] },
    })
  }
  const changes = diffQuotes(accepted, fresh, accepted.expiresAt <= isoNow())
  if (changes.length > 0 || fresh.items.length === 0) {
    fail('QUOTE_STALE', 'A cotação mudou; revise e confirme novamente', {
      details: { quote: toQuoteDto(db, fresh), changes },
    })
  }
  return fresh
}

function buildReceipt(
  db: DbState,
  quote: ReturnType<typeof createQuote>,
  walletAddress: string,
): OrderRecord['receipt'] {
  return {
    items: quote.items.map((item) => {
      const nft = findNft(db, item.nftId)
      const edition = nft.editions.find((candidate) => candidate.id === item.editionId)
      return {
        nftId: nft.id,
        editionId: item.editionId,
        name: nft.name,
        tokenId: nft.tokenId,
        editionLabel: edition?.label ?? '',
        image: nft.image,
        quantity: item.quantity,
        unitPriceEth: item.unitPriceEth,
        lineTotalEth: item.lineTotalEth,
      }
    }),
    subtotalEth: quote.subtotalEth,
    discountEth: quote.discountEth,
    networkFeeEth: quote.networkFeeEth,
    totalEth: quote.totalEth,
    coupon: quote.couponCode,
    network: quote.network,
    walletAddress,
  }
}

export interface CreateOrderResult {
  order: OrderRecord
  created: boolean
}

/** Criação idempotente: mesma chave + mesmo corpo → mesmo pedido; corpo diferente → 409. */
export interface CreateOrderInput {
  idempotencyKey: string
  body: CreateOrderBody
  plan: OrderResolutionPlan
}

export function createOrder(
  db: DbState,
  userId: string,
  { idempotencyKey, body, plan }: CreateOrderInput,
): CreateOrderResult {
  const bodyHash = canonicalJson(body)
  const previous = db.idempotency.find((record) => record.key === idempotencyKey && record.userId === userId)
  if (previous) {
    if (previous.bodyHash !== bodyHash)
      fail('IDEMPOTENCY_CONFLICT', 'Chave de idempotência reutilizada com outro conteúdo')
    return { order: findOwnOrder(db, userId, previous.orderId), created: false }
  }
  const wallet = assertWallet(db, userId, body)
  const quote = revalidateQuote(db, userId, body)
  const now = isoNow()
  const order: OrderRecord = {
    id: nextId(db, 'ord'),
    userId,
    version: 1,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    declineReason: null,
    receipt: buildReceipt(db, quote, wallet.address),
    transaction: null,
    resolution: { status: plan.status, at: isoIn(plan.afterMs), reason: plan.reason },
  }
  db.orders.push(order)
  db.idempotency.push({ key: idempotencyKey, userId, bodyHash, orderId: order.id })
  return { order, created: true }
}

const transactionHash = (orderId: string) =>
  `0x${Array.from(orderId, (char) => char.charCodeAt(0).toString(16))
    .join('')
    .padEnd(64, 'a')
    .slice(0, 64)}`

function decrementAvailability(context: DomainContext, order: OrderRecord) {
  for (const item of order.receipt.items) {
    const nft = findNft(context.db, item.nftId)
    const edition = nft.editions.find((candidate) => candidate.id === item.editionId)
    if (!edition) continue
    edition.available = Math.max(0, edition.available - item.quantity)
    edition.status = edition.available > 0 ? 'available' : 'sold-out'
    nft.version += 1
    context.emit(nftUpdatedEvent(nft))
  }
}

/** Estados confirmados e recusados são terminais: novas resoluções são ignoradas. */
export interface ResolveOrderInput {
  orderId: string
  status: Exclude<OrderStatus, 'pending'>
  reason: string | null
}

export function resolveOrder(context: DomainContext, { orderId, status, reason }: ResolveOrderInput): OrderRecord {
  const order = requireFound(
    context.db.orders.find((candidate) => candidate.id === orderId),
    'Pedido',
  )
  if (order.status !== 'pending') return order
  order.status = status
  order.updatedAt = isoNow()
  order.version += 1
  order.resolution = null
  if (status === 'confirmed') {
    const hash = transactionHash(order.id)
    order.transaction = { hash, explorerUrl: `/explorer/tx/${hash}`, simulated: true }
    decrementAvailability(context, order)
    removePurchased(context.db, order.userId, order.receipt.items)
  } else {
    order.declineReason = reason ?? 'Pagamento recusado pela carteira (simulado)'
  }
  context.emit({
    type: 'order.updated',
    resource: { type: 'order', id: order.id },
    version: order.version,
    userId: order.userId,
    data: { status: order.status, declineReason: order.declineReason, transaction: order.transaction },
  })
  return order
}

/** Pedidos pendentes cujo horário de resolução já passou (ex.: após refresh). */
export const dueResolutions = (db: DbState, nowIso: string) =>
  db.orders.filter((order) => order.status === 'pending' && order.resolution && order.resolution.at <= nowIso)
