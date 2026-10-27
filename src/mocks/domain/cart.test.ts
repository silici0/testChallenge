// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { addCartItem, applyCoupon, getOrCreateCart, mergeGuestCart, toCartDto, updateCartItem } from './cart'
import type { DomainError } from './context'
import { createTestDatabase } from './test-utils'

const EMERALD = 'nft_emerald-ape-042'
const EDITION_50 = 'ed_emerald-ape-042_1-50'

async function cartWithEmerald(quantity = 2) {
  const setup = await createTestDatabase()
  await setup.db.transaction(({ db }) => {
    db.nfts.find((nft) => nft.id === EMERALD)!.editions.find((edition) => edition.id === EDITION_50)!.available = 40
    addCartItem(db, getOrCreateCart(db, { type: 'user', id: 'usr_bruno' }), {
      nftId: EMERALD,
      editionId: EDITION_50,
      quantity,
    })
  })
  const cart = () => setup.db.read((db) => toCartDto(db, getOrCreateCart(db, { type: 'user', id: 'usr_bruno' })))
  return { ...setup, cart }
}

const errorOf = async (action: () => Promise<unknown>) =>
  action().then(
    () => null,
    (error: unknown) => error as DomainError,
  )

describe('carrinho simulado', () => {
  it('calcula subtotal, taxa e total pela API (strings decimais)', async () => {
    const { cart } = await cartWithEmerald(2)
    const { items, summary } = cart()
    expect(items[0]?.lineTotalEth).toBe(summary.subtotalEth)
    expect(summary.networkFeeEth).toBe('0.016')
    expect(Number(summary.totalEth)).toBeCloseTo(Number(summary.subtotalEth) + 0.016, 12)
  })

  it('soma quantidades da mesma edição e respeita maxPerOrder', async () => {
    const { db } = await cartWithEmerald(9)
    const error = await errorOf(() =>
      db.transaction(({ db: state }) => {
        addCartItem(state, getOrCreateCart(state, { type: 'user', id: 'usr_bruno' }), {
          nftId: EMERALD,
          editionId: EDITION_50,
          quantity: 2,
        })
      }),
    )
    expect(error).toMatchObject({ code: 'AVAILABILITY_CONFLICT', extra: { details: { available: 10 } } })
  })

  it('cupom válido aplica desconto; expirado e inválido têm erros distintos', async () => {
    const { db, cart } = await cartWithEmerald(2)
    const apply = (code: string) =>
      errorOf(() =>
        db.transaction(({ db: state }) => {
          applyCoupon(state, getOrCreateCart(state, { type: 'user', id: 'usr_bruno' }), code)
        }),
      )
    expect(await apply('EXPIRED20')).toMatchObject({ code: 'COUPON_EXPIRED' })
    expect(await apply('XYZ')).toMatchObject({ code: 'COUPON_INVALID' })
    expect(await apply('JUNGLE10')).toBeNull()
    expect(cart().summary.coupon).toMatchObject({ code: 'JUNGLE10', status: 'applied' })
    expect(cart().summary.discountEth).not.toBe('0')
  })

  it('sinaliza preço alterado até o usuário interagir com o carrinho', async () => {
    const { db, cart } = await cartWithEmerald(1)
    const before = cart().items[0]!.unitPriceEth
    await db.transaction(({ db: state }) => {
      state.nfts.find((nft) => nft.id === EMERALD)!.editions.find((edition) => edition.id === EDITION_50)!.priceEth =
        '9.99'
    })
    expect(cart().issues).toEqual([
      { type: 'PRICE_CHANGED', itemId: cart().items[0]!.id, previousEth: before, currentEth: '9.99' },
    ])

    await db.transaction(({ db: state }) => {
      const userCart = getOrCreateCart(state, { type: 'user', id: 'usr_bruno' })
      updateCartItem(state, userCart, { itemId: userCart.items[0]!.id, quantity: 1 })
    })
    expect(cart().issues).toEqual([])
  })

  it('edição esgotada sai do resumo e aparece como SOLD_OUT', async () => {
    const { db, cart } = await cartWithEmerald(1)
    await db.transaction(({ db: state }) => {
      state.nfts.find((nft) => nft.id === EMERALD)!.editions.find((edition) => edition.id === EDITION_50)!.available = 0
    })
    expect(cart().issues[0]).toMatchObject({ type: 'SOLD_OUT' })
    expect(cart().summary.subtotalEth).toBe('0')
  })

  it('mescla o carrinho do visitante no do usuário', async () => {
    const { db, cart } = await cartWithEmerald(1)
    await db.transaction(({ db: state }) => {
      addCartItem(state, getOrCreateCart(state, { type: 'guest', id: 'guest-1' }), {
        nftId: EMERALD,
        editionId: EDITION_50,
        quantity: 2,
      })
      mergeGuestCart(state, 'guest-1', 'usr_bruno')
    })
    expect(cart().items[0]?.quantity).toBe(3)
    expect(db.read((state) => getOrCreateCart(state, { type: 'guest', id: 'guest-1' }).items)).toEqual([])
  })
})
