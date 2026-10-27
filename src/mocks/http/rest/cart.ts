import {
  addCartItemBodySchema,
  applyCouponBodySchema,
  createQuoteBodySchema,
  updateCartItemBodySchema,
} from '@/contracts'

import type { DbState } from '../../db/schema'
import {
  addCartItem,
  applyCoupon,
  type CartOwner,
  getOrCreateCart,
  removeCartItem,
  removeCoupon,
  toCartDto,
  updateCartItem,
} from '../../domain/cart'
import { createQuote, toQuoteDto } from '../../domain/quote'
import { createRoute, type MockServices, type RouteContext } from '../responder'

/** Dono do carrinho: usuário autenticado ou visitante identificado por X-Guest-Cart-Id. */
async function resolveOwner(context: RouteContext): Promise<CartOwner> {
  if (context.token) return { type: 'user', id: (await context.requireUser()).id }
  if (context.guestCartId) return { type: 'guest', id: context.guestCartId }
  return { type: 'guest', id: 'anonymous' }
}

export function cartRoutes(services: MockServices) {
  const { route, privateRoute } = createRoute(services)
  const withCart = async (
    context: RouteContext,
    mutate?: (db: DbState, cart: ReturnType<typeof getOrCreateCart>) => void,
  ) => {
    const owner = await resolveOwner(context)
    return services.db.transaction(({ db }) => {
      const cart = getOrCreateCart(db, owner)
      mutate?.(db, cart)
      return toCartDto(db, cart)
    })
  }

  return [
    route('get', '/cart', (context) => withCart(context)),
    route('post', '/cart/items', async (context) => {
      const body = addCartItemBodySchema.parse(await context.json())
      return withCart(context, (db, cart) => {
        addCartItem(db, cart, body)
      })
    }),
    route('patch', '/cart/items/:itemId', async (context) => {
      const { quantity } = updateCartItemBodySchema.parse(await context.json())
      return withCart(context, (db, cart) => {
        updateCartItem(db, cart, { itemId: String(context.params.itemId), quantity })
      })
    }),
    route('delete', '/cart/items/:itemId', (context) =>
      withCart(context, (db, cart) => {
        removeCartItem(db, cart, String(context.params.itemId))
      }),
    ),
    route('put', '/cart/coupon', async (context) => {
      const { code } = applyCouponBodySchema.parse(await context.json())
      return withCart(context, (db, cart) => {
        applyCoupon(db, cart, code)
      })
    }),
    route('delete', '/cart/coupon', (context) =>
      withCart(context, (db, cart) => {
        removeCoupon(db, cart)
      }),
    ),
    privateRoute('post', '/quotes', async (context) => {
      const user = await context.requireUser()
      const { network } = createQuoteBodySchema.parse(await context.json())
      const { scenario } = services.scenarios
      return services.db.transaction((domain) => {
        const quote = toQuoteDto(domain.db, createQuote(domain.db, user.id, network))
        if (scenario.afterFirstQuote && services.scenarios.once('after-first-quote'))
          scenario.afterFirstQuote(domain, user.id)
        return { status: 201, body: quote }
      })
    }),
  ]
}
