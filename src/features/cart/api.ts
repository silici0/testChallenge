import { queryOptions } from '@tanstack/react-query'

import { type AddCartItemBody, cartSchema } from '@/contracts'
import { httpClient } from '@/shared/api'
import { queryKeys } from '@/shared/query'

/** Dono do carrinho no cache: usuário autenticado ou visitante (docs/cart.md). */
export type CartOwner = { type: 'user'; userId: string } | { type: 'guest'; guestCartId: string }

export const cartKey = (owner: CartOwner) =>
  owner.type === 'user' ? queryKeys.user.cart(owner.userId) : queryKeys.guestCart(owner.guestCartId)

export const cartQuery = (owner: CartOwner) =>
  queryOptions({
    queryKey: cartKey(owner),
    queryFn: ({ signal }) => httpClient().request({ method: 'GET', url: '/cart', schema: cartSchema, signal }),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

const request = (method: 'POST' | 'PATCH' | 'DELETE' | 'PUT', url: string, data?: unknown) =>
  httpClient().request({ method, url, data, schema: cartSchema })

export const cartApi = {
  add: (body: AddCartItemBody) => request('POST', '/cart/items', body),
  updateQuantity: (itemId: string, quantity: number) => request('PATCH', `/cart/items/${itemId}`, { quantity }),
  remove: (itemId: string) => request('DELETE', `/cart/items/${itemId}`),
  applyCoupon: (code: string) => request('PUT', '/cart/coupon', { code }),
  removeCoupon: () => request('DELETE', '/cart/coupon'),
}
