import { createFileRoute } from '@tanstack/react-router'

import { requireAuth } from '@/features/auth/guards'

// Esqueleto: substituído pela tela real nesta mesma etapa de telas.
export const Route = createFileRoute('/checkout')({
  beforeLoad: requireAuth,
  component: () => (
    <main>
      <h1 className="text-h1 font-bold">Pagamento</h1>
    </main>
  ),
})
