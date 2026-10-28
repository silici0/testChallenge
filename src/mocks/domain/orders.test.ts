// @vitest-environment node
import { describe, expect, it } from 'vitest'

import type { CreateOrderBody } from '@/contracts'

import { setWalletConnection } from './account'
import { addCartItem, getOrCreateCart, toCartDto } from './cart'
import type { DomainError } from './context'
import { canonicalJson, createOrder, resolveOrder, toOrderDto } from './orders'
import { createQuote } from './quote'
import { createTestDatabase } from './test-utils'

const EMERALD = 'nft_emerald-ape-042'
const EDITION = 'ed_emerald-ape-042_1-50'
const confirm = { status: 'confirmed' as const, afterMs: 3000, reason: null }

async function checkoutReady() {
  const setup = await createTestDatabase()
  const quoteId = await setup.db.transaction(({ db }) => {
    db.nfts.find((nft) => nft.id === EMERALD)!.editions.find((edition) => edition.id === EDITION)!.available = 40
    addCartItem(db, getOrCreateCart(db, { type: 'user', id: 'usr_ana' }), {
      nftId: EMERALD,
      editionId: EDITION,
      quantity: 2,
    })
    setWalletConnection(db, 'usr_ana', { walletId: 'wal_ana-primary', connection: 'connected' })
    return createQuote(db, 'usr_ana', 'ethereum').id
  })
  const body: CreateOrderBody = {
    quoteId,
    walletId: 'wal_ana-primary',
    network: 'ethereum',
    buyer: { displayName: 'Ana', username: 'ana.collector', email: 'ana@example.test', referralCode: null, note: null },
  }
  const place = (key: string, payload: CreateOrderBody = body) =>
    setup.db
      .transaction(({ db }) => createOrder(db, 'usr_ana', { idempotencyKey: key, body: payload, plan: confirm }))
      .then(
        (result) => result,
        (error: unknown) => error as DomainError,
      )
  return { ...setup, body, place }
}

describe('pedidos simulados', () => {
  it('JSON canônico ignora a ordem das chaves', () => {
    expect(canonicalJson({ b: 1, a: { d: 2, c: 3 } })).toBe(canonicalJson({ a: { c: 3, d: 2 }, b: 1 }))
  })

  it('mesma chave e mesmo corpo recuperam o mesmo pedido (timeout/reenvio)', async () => {
    const { place } = await checkoutReady()
    const first = await place('key-1')
    const retry = await place('key-1')
    expect(retry).toMatchObject({ created: false })
    expect('order' in retry && 'order' in first && retry.order.id === first.order.id).toBe(true)
  })

  it('mesma chave com outro corpo gera conflito', async () => {
    const { place, body } = await checkoutReady()
    await place('key-1')
    expect(await place('key-1', { ...body, network: 'polygon' })).toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' })
  })

  it('nova cotação com os mesmos valores não invalida a revisada (refetch do cliente)', async () => {
    const { db, place } = await checkoutReady()
    await db.transaction(({ db: state }) => createQuote(state, 'usr_ana', 'ethereum'))
    expect(await place('key-refetch')).toMatchObject({ created: true })
  })

  it('preço alterado após a cotação exige nova confirmação (QUOTE_STALE com mudanças)', async () => {
    const { db, place } = await checkoutReady()
    await db.transaction(({ db: state }) => {
      state.nfts.find((nft) => nft.id === EMERALD)!.editions.find((edition) => edition.id === EDITION)!.priceEth =
        '7.77'
    })
    const error = await place('key-2')
    expect(error).toMatchObject({ code: 'QUOTE_STALE' })
    expect((error as DomainError).extra.details?.changes).toEqual([
      expect.objectContaining({ field: 'price', current: '7.77' }),
    ])
  })

  it('confirmação remove só o comprado, baixa a disponibilidade e emite eventos versionados', async () => {
    const { db, events, place } = await checkoutReady()
    const result = await place('key-3')
    const orderId = 'order' in result ? result.order.id : ''
    await db.transaction(({ db: state }) => {
      addCartItem(state, getOrCreateCart(state, { type: 'user', id: 'usr_ana' }), {
        nftId: EMERALD,
        editionId: EDITION,
        quantity: 1,
      })
    })
    await db.transaction((context) => resolveOrder(context, { orderId, status: 'confirmed', reason: null }))

    const order = db.read((state) => toOrderDto(state.orders.find((candidate) => candidate.id === orderId)!))
    expect(order).toMatchObject({ status: 'confirmed', version: 2, transaction: { simulated: true } })
    expect(
      db.read((state) => toCartDto(state, getOrCreateCart(state, { type: 'user', id: 'usr_ana' })).items[0]?.quantity),
    ).toBe(1)
    expect(events.map((event) => event.type)).toEqual(['nft.updated', 'order.updated'])
    expect(events[1]).toMatchObject({ resource: { type: 'order', id: orderId }, version: 2, userId: 'usr_ana' })
  })

  it('estado terminal não é alterado por nova resolução', async () => {
    const { db, place } = await checkoutReady()
    const result = await place('key-4')
    const orderId = 'order' in result ? result.order.id : ''
    await db.transaction((context) =>
      resolveOrder(context, { orderId, status: 'declined', reason: 'Saldo insuficiente' }),
    )
    const after = await db.transaction((context) =>
      resolveOrder(context, { orderId, status: 'confirmed', reason: null }),
    )
    expect(after).toMatchObject({ status: 'declined', declineReason: 'Saldo insuficiente' })
  })

  it('o recibo é um snapshot: mudanças no catálogo não o alteram', async () => {
    const { db, place } = await checkoutReady()
    const result = await place('key-5')
    const receiptBefore = 'order' in result ? structuredClone(result.order.receipt) : null
    await db.transaction(({ db: state }) => {
      state.nfts.find((nft) => nft.id === EMERALD)!.editions.find((edition) => edition.id === EDITION)!.priceEth = '99'
    })
    expect(db.read((state) => state.orders.at(-1)?.receipt)).toEqual(receiptBefore)
  })
})
