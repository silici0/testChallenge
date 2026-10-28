import { redirect } from '@tanstack/react-router'

import type { User } from '@/contracts'

/** Só caminhos internos (evita open redirect — docs/session.md). */
export const isSafeRedirect = (value: unknown): value is string =>
  typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')

interface GuardContext {
  user: User | null
  session?: { hasExpired: () => boolean }
}

/**
 * Rotas privadas: visitante vai ao login e volta para onde estava (enunciado §3.4).
 * Se a sessão acabou de expirar, o motivo vai junto: ao recarregar com a sessão vencida, este redirect
 * concorre com o do `session.expire()` e não pode perder o aviso.
 */
export function requireAuth({ context, location }: { context: GuardContext; location: { href: string } }) {
  if (!context.user)
    throw redirect({
      to: '/login',
      search: { redirect: location.href, reason: context.session?.hasExpired() ? 'expired' : undefined },
    })
  return { user: context.user }
}

/** Login/cadastro com sessão ativa: segue direto para o destino. */
export function redirectIfAuthenticated({
  context,
  search,
}: {
  context: { user: User | null }
  search: { redirect?: string | undefined }
}) {
  if (context.user) throw redirect({ to: isSafeRedirect(search.redirect) ? search.redirect : '/' })
}
