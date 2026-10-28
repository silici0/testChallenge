import type { Network, Quote, QuoteChange } from '@/contracts'

import { isoIn, isoNow, nextId } from '../db/runtime'
import type { DbState, QuoteRecord } from '../db/schema'
import { getOrCreateCart, resolveCartLines } from './cart'
import { requireFound } from './context'
import { computeSummary } from './pricing'

export const QUOTE_TTL_MS = 2 * 60_000

export function toQuoteDto(db: DbState, record: QuoteRecord): Quote {
  const cart = requireFound(
    db.carts.find((candidate) => candidate.id === record.cartId),
    'Carrinho',
  )
  const lines = resolveCartLines(db, cart)
  const coupon = record.couponCode
    ? computeSummary({
        db,
        lineTotals: [record.subtotalEth],
        couponCode: record.couponCode,
        network: record.network,
        nowIso: isoNow(),
      }).coupon
    : null
  return {
    id: record.id,
    cartVersion: record.cartVersion,
    network: record.network,
    items: record.items,
    subtotalEth: record.subtotalEth,
    discountEth: record.discountEth,
    networkFeeEth: record.networkFeeEth,
    totalEth: record.totalEth,
    coupon,
    issues: lines.flatMap((line) => (line.issue ? [line.issue] : [])),
    expiresAt: record.expiresAt,
  }
}

/** Cotação do carrinho atual do usuário: valida preços, disponibilidade, cupom e taxa. */
export function createQuote(db: DbState, userId: string, network: Network): QuoteRecord {
  const cart = getOrCreateCart(db, { type: 'user', id: userId })
  const lines = resolveCartLines(db, cart).filter((line) => line.purchasable)
  const summary = computeSummary({
    db,
    lineTotals: lines.map((line) => line.item.lineTotalEth),
    couponCode: cart.couponCode,
    network,
    nowIso: isoNow(),
  })
  const record: QuoteRecord = {
    id: nextId(db, 'qt'),
    userId,
    cartId: cart.id,
    cartVersion: cart.version,
    network,
    items: lines.map(({ item }) => ({
      itemId: item.id,
      nftId: item.nftId,
      editionId: item.editionId,
      quantity: item.quantity,
      unitPriceEth: item.unitPriceEth,
      lineTotalEth: item.lineTotalEth,
    })),
    subtotalEth: summary.subtotalEth,
    discountEth: summary.discountEth,
    networkFeeEth: summary.networkFeeEth,
    totalEth: summary.totalEth,
    couponCode: summary.coupon?.status === 'applied' ? summary.coupon.code : null,
    expiresAt: isoIn(QUOTE_TTL_MS),
  }
  // Cotações anteriores continuam válidas até expirar (o cliente pode refazer a cotação a qualquer momento);
  // a revalidação no pedido compara valores, não identidade. Limite por usuário para não crescer sem fim.
  const now = isoNow()
  const others = db.quotes.filter((quote) => quote.userId !== userId)
  const mine = db.quotes.filter((quote) => quote.userId === userId && quote.expiresAt > now).slice(-9)
  db.quotes = [...others, ...mine, record]
  return record
}

/** Diferenças entre a cotação aceita pelo usuário e a situação atual (revalidação antes de confirmar). */
export function diffQuotes(accepted: QuoteRecord, fresh: QuoteRecord, isExpired: boolean): QuoteChange[] {
  const changes: QuoteChange[] = []
  if (isExpired) changes.push({ field: 'expired', itemId: null, previous: accepted.expiresAt, current: null })
  for (const item of accepted.items) {
    const current = fresh.items.find((candidate) => candidate.itemId === item.itemId)
    if (!current)
      changes.push({ field: 'availability', itemId: item.itemId, previous: String(item.quantity), current: '0' })
    else if (current.quantity !== item.quantity) {
      changes.push({
        field: 'availability',
        itemId: item.itemId,
        previous: String(item.quantity),
        current: String(current.quantity),
      })
    } else if (current.unitPriceEth !== item.unitPriceEth) {
      changes.push({ field: 'price', itemId: item.itemId, previous: item.unitPriceEth, current: current.unitPriceEth })
    }
  }
  if (fresh.items.length !== accepted.items.length && changes.length === 0) {
    changes.push({
      field: 'availability',
      itemId: null,
      previous: String(accepted.items.length),
      current: String(fresh.items.length),
    })
  }
  if (accepted.couponCode !== fresh.couponCode)
    changes.push({ field: 'coupon', itemId: null, previous: accepted.couponCode, current: fresh.couponCode })
  if (accepted.networkFeeEth !== fresh.networkFeeEth)
    changes.push({ field: 'fee', itemId: null, previous: accepted.networkFeeEth, current: fresh.networkFeeEth })
  return changes
}
