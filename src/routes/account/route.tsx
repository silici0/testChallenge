import { createFileRoute } from '@tanstack/react-router'

import { AccountLayout } from '@/features/account/account-layout'
import { requireAuth } from '@/features/auth/guards'

export const Route = createFileRoute('/account')({
  staticData: { requiresAuth: true },
  beforeLoad: requireAuth,
  component: AccountLayout,
})
