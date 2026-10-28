import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { LoginPage } from '@/features/auth/auth-pages'
import { isSafeRedirect, redirectIfAuthenticated } from '@/features/auth/guards'

export const loginSearchSchema = z.object({
  redirect: z.string().refine(isSafeRedirect).optional().catch(undefined),
  reason: z.enum(['expired']).optional().catch(undefined),
})

export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,
  beforeLoad: ({ context, search }) => {
    redirectIfAuthenticated({ context, search })
  },
  head: () => ({ meta: [{ title: 'Entrar — Kurio' }] }),
  component: function LoginRoute() {
    const { redirect, reason } = Route.useSearch()
    return <LoginPage redirect={redirect} reason={reason} />
  },
})
