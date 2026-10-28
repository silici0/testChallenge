import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

/** Só aceita caminhos internos (evita open redirect — docs/session.md). */
const internalPath = z
  .string()
  .refine((value) => value.startsWith('/') && !value.startsWith('//'))
  .optional()
  .catch(undefined)

export const loginSearchSchema = z.object({
  redirect: internalPath,
  reason: z.enum(['expired']).optional().catch(undefined),
})

export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,
  component: LoginPage,
})

// Tela real implementada na etapa de telas (Figma: Desktop/Mobile Login).
function LoginPage() {
  const { reason } = Route.useSearch()
  return (
    <main>
      <h1 className="text-h1 font-bold">Entrar</h1>
      {reason === 'expired' && <p role="alert">Sua sessão expirou. Entre novamente para continuar.</p>}
    </main>
  )
}
