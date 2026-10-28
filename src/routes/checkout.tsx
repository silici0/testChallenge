import { createFileRoute } from '@tanstack/react-router'

import { requireAuth } from '@/features/auth/guards'
import { CheckoutPage } from '@/features/checkout/checkout-page'

export const Route = createFileRoute('/checkout')({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: 'Pagamento — Kurio' }] }),
  component: CheckoutPage,
})
