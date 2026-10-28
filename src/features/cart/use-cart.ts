import { useQuery } from '@tanstack/react-query'

import { useSession } from '@/features/auth/use-session'

import { type CartOwner, cartQuery } from './api'

export function useCartOwner(): CartOwner {
  const { user, guestCartId } = useSession()
  return user ? { type: 'user', userId: user.id } : { type: 'guest', guestCartId }
}

/** Carrinho do dono atual (visitante ou usuário). */
export function useCart() {
  return useQuery(cartQuery(useCartOwner()))
}

/** Total de unidades no carrinho (badge do header). */
export function useCartCount(): number {
  const { data } = useCart()
  return data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0
}
