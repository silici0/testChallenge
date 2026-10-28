import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { RegisterPage } from '@/features/auth/auth-pages'
import { isSafeRedirect, redirectIfAuthenticated } from '@/features/auth/guards'

export const Route = createFileRoute('/register')({
  validateSearch: z.object({ redirect: z.string().refine(isSafeRedirect).optional().catch(undefined) }),
  beforeLoad: ({ context, search }) => {
    redirectIfAuthenticated({ context, search })
  },
  head: () => ({ meta: [{ title: 'Criar conta — Kurio' }] }),
  component: function RegisterRoute() {
    const { redirect } = Route.useSearch()
    return <RegisterPage redirect={redirect} />
  },
})
