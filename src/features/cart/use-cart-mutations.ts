import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { AddCartItemBody, Cart } from '@/contracts'
import { announce } from '@/shared/a11y'
import { queryKeys } from '@/shared/query'

import { cartApi, cartKey } from './api'
import { useCartOwner } from './use-cart'

/**
 * Mutations do carrinho: a resposta da API (carrinho completo, com resumo) substitui o cache;
 * a cotação do checkout é invalidada porque depende do carrinho (docs/cart.md).
 */
export function useCartMutations() {
  const queryClient = useQueryClient()
  const owner = useCartOwner()
  const key = cartKey(owner)

  const onCart = (cart: Cart) => {
    queryClient.setQueryData(key, cart)
    if (owner.type === 'user')
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.user.scope(owner.userId), 'quote'] })
  }

  const add = useMutation({
    mutationFn: (body: AddCartItemBody) => cartApi.add(body),
    onSuccess: (cart) => {
      onCart(cart)
      announce('Item adicionado ao carrinho.', 'polite')
    },
  })
  const updateQuantity = useMutation({
    // Alterações da mesma linha são serializadas (a última quantidade prevalece).
    scope: { id: 'cart-quantity' },
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartApi.updateQuantity(itemId, quantity),
    onSuccess: onCart,
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: key })
    },
  })
  const remove = useMutation({
    mutationFn: ({ itemId }: { itemId: string; name: string }) => cartApi.remove(itemId),
    onSuccess: (cart, { name }) => {
      onCart(cart)
      announce(`${name} removido do carrinho.`, 'polite')
    },
  })
  const applyCoupon = useMutation({
    mutationFn: (code: string) => cartApi.applyCoupon(code),
    onSuccess: (cart) => {
      onCart(cart)
      announce('Cupom aplicado.', 'polite')
    },
  })
  const removeCoupon = useMutation({
    mutationFn: () => cartApi.removeCoupon(),
    onSuccess: (cart) => {
      onCart(cart)
      announce('Cupom removido.', 'polite')
    },
  })

  return { add, updateQuantity, remove, applyCoupon, removeCoupon }
}
