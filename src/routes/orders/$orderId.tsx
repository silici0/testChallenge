import { createFileRoute } from '@tanstack/react-router'

import { requireAuth } from '@/features/auth/guards'
import { OrderPage } from '@/features/orders/order-page'

export const Route = createFileRoute('/orders/$orderId')({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: 'Pedido — Kurio' }] }),
  component: OrderPage,
})
