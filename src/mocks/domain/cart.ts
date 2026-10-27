import type { AddCartItemBody, Cart, CartIssue, CartItem, Network } from '@/contracts'
import { multiplyEth } from '@/shared/lib/money'

import { isoNow, nextId } from '../db/runtime'
import type { CartItemRecord, CartRecord, DbState } from '../db/schema'
import { findNft } from './catalog'
import { fail, requireFound } from './context'
import { assertCouponApplicable, computeSummary } from './pricing'

export interface CartOwner {
  type: 'guest' | 'user'
  id: string
}

export function getOrCreateCart(db: DbState, owner: CartOwner): CartRecord {
  const existing = db.carts.find((cart) => cart.ownerType === owner.type && cart.ownerId === owner.id)
  if (existing) return existing
  const cart: CartRecord = {
    id: nextId(db, 'cart'),
    ownerType: owner.type,
    ownerId: owner.id,
    items: [],
    couponCode: null,
    version: 1,
  }
  db.carts.push(cart)
  return cart
}

function findEdition(db: DbState, nftId: string, editionId: string) {
  const nft = findNft(db, nftId)
  const edition = requireFound(
    nft.editions.find((candidate) => candidate.id === editionId),
    'Edição',
  )
  return { nft, edition }
}

interface ResolvedLine {
  item: CartItem
  issue: CartIssue | null
  purchasable: boolean
}

/** Linha do carrinho com preço e disponibilidade atuais; quantidade limitada ao disponível. */
function resolveLine(db: DbState, record: CartItemRecord): ResolvedLine {
  const { nft, edition } = findEdition(db, record.nftId, record.editionId)
  const limit = Math.min(edition.available, edition.maxPerOrder)
  const quantity = Math.max(1, Math.min(record.quantity, limit))
  const item: CartItem = {
    id: record.id,
    nftId: nft.id,
    editionId: edition.id,
    nft: { id: nft.id, name: nft.name, tokenId: nft.tokenId, image: nft.image },
    editionLabel: edition.label,
    quantity,
    unitPriceEth: edition.priceEth,
    lineTotalEth: multiplyEth(edition.priceEth, quantity),
    available: edition.available,
    maxPerOrder: edition.maxPerOrder,
  }
  if (limit === 0) return { item, issue: { type: 'SOLD_OUT', itemId: record.id }, purchasable: false }
  if (record.quantity > limit) {
    return {
      item,
      issue: { type: 'QUANTITY_REDUCED', itemId: record.id, requested: record.quantity, available: limit },
      purchasable: true,
    }
  }
  if (record.seenPriceEth !== edition.priceEth) {
    return {
      item,
      issue: {
        type: 'PRICE_CHANGED',
        itemId: record.id,
        previousEth: record.seenPriceEth,
        currentEth: edition.priceEth,
      },
      purchasable: true,
    }
  }
  return { item, issue: null, purchasable: true }
}

export function resolveCartLines(db: DbState, cart: CartRecord) {
  return cart.items.map((record) => resolveLine(db, record))
}

export function toCartDto(db: DbState, cart: CartRecord, network: Network = 'ethereum'): Cart {
  const lines = resolveCartLines(db, cart)
  const purchasable = lines.filter((line) => line.purchasable)
  return {
    id: cart.id,
    ownerType: cart.ownerType,
    version: cart.version,
    items: lines.map((line) => line.item),
    couponCode: cart.couponCode,
    summary: computeSummary({
      db,
      lineTotals: purchasable.map((line) => line.item.lineTotalEth),
      couponCode: cart.couponCode,
      network,
      nowIso: isoNow(),
    }),
    issues: lines.flatMap((line) => (line.issue ? [line.issue] : [])),
  }
}

/** Mutação do carrinho: o usuário viu os preços e limites atuais, então as alterações pendentes são reconhecidas. */
function touch(db: DbState, cart: CartRecord) {
  for (const record of cart.items) {
    const { edition } = findEdition(db, record.nftId, record.editionId)
    const limit = Math.min(edition.available, edition.maxPerOrder)
    record.seenPriceEth = edition.priceEth
    if (limit > 0) record.quantity = Math.min(record.quantity, limit)
  }
  cart.version += 1
}

function assertAvailable(
  db: DbState,
  { nftId, editionId, quantity }: { nftId: string; editionId: string; quantity: number },
) {
  const { edition } = findEdition(db, nftId, editionId)
  const limit = Math.min(edition.available, edition.maxPerOrder)
  if (quantity > limit) {
    const message = limit === 0 ? 'Edição esgotada' : `Disponível: até ${limit} por pedido`
    fail('AVAILABILITY_CONFLICT', message, { details: { available: limit }, fieldErrors: { quantity: [message] } })
  }
  return edition
}

export function addCartItem(db: DbState, cart: CartRecord, body: AddCartItemBody): void {
  const existing = cart.items.find((record) => record.nftId === body.nftId && record.editionId === body.editionId)
  const quantity = (existing?.quantity ?? 0) + body.quantity
  const edition = assertAvailable(db, { nftId: body.nftId, editionId: body.editionId, quantity })
  if (existing) existing.quantity = quantity
  else
    cart.items.push({
      id: nextId(db, 'item'),
      nftId: body.nftId,
      editionId: body.editionId,
      quantity,
      seenPriceEth: edition.priceEth,
    })
  touch(db, cart)
}

const findItem = (cart: CartRecord, itemId: string) =>
  requireFound(
    cart.items.find((record) => record.id === itemId),
    'Item do carrinho',
  )

export function updateCartItem(
  db: DbState,
  cart: CartRecord,
  { itemId, quantity }: { itemId: string; quantity: number },
): void {
  const record = findItem(cart, itemId)
  assertAvailable(db, { nftId: record.nftId, editionId: record.editionId, quantity })
  record.quantity = quantity
  touch(db, cart)
}

export function removeCartItem(db: DbState, cart: CartRecord, itemId: string): void {
  findItem(cart, itemId)
  cart.items = cart.items.filter((record) => record.id !== itemId)
  touch(db, cart)
}

export function applyCoupon(db: DbState, cart: CartRecord, code: string): void {
  const subtotal = toCartDto(db, cart).summary.subtotalEth
  assertCouponApplicable(db, { code, subtotalEth: subtotal, nowIso: isoNow() })
  cart.couponCode = code
  touch(db, cart)
}

export function removeCoupon(db: DbState, cart: CartRecord): void {
  cart.couponCode = null
  touch(db, cart)
}

/** Login/cadastro: itens do visitante somados aos do usuário, limitados ao disponível. */
export function mergeGuestCart(db: DbState, guestCartId: string, userId: string): void {
  const guest = db.carts.find((cart) => cart.ownerType === 'guest' && cart.ownerId === guestCartId)
  if (!guest || guest.items.length === 0) return
  const target = getOrCreateCart(db, { type: 'user', id: userId })
  for (const record of guest.items) {
    const existing = target.items.find((item) => item.nftId === record.nftId && item.editionId === record.editionId)
    if (existing) existing.quantity += record.quantity
    else target.items.push({ ...record, id: nextId(db, 'item') })
  }
  target.couponCode ??= guest.couponCode
  target.version += 1
  guest.items = []
  guest.couponCode = null
  guest.version += 1
}

/** Após confirmação: remove apenas as quantidades compradas (itens adicionados depois permanecem). */
export function removePurchased(
  db: DbState,
  userId: string,
  purchased: { nftId: string; editionId: string; quantity: number }[],
): void {
  const cart = db.carts.find((candidate) => candidate.ownerType === 'user' && candidate.ownerId === userId)
  if (!cart) return
  for (const line of purchased) {
    const record = cart.items.find((item) => item.nftId === line.nftId && item.editionId === line.editionId)
    if (record) record.quantity -= line.quantity
  }
  cart.items = cart.items.filter((record) => record.quantity > 0)
  cart.version += 1
}
