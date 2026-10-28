import { createFileRoute } from '@tanstack/react-router'

import { AccountLayout } from '@/features/account/account-layout'
import { requireAuth } from '@/features/auth/guards'

export const Route = createFileRoute('/account')({
  beforeLoad: requireAuth,
  component: AccountLayout,
})
