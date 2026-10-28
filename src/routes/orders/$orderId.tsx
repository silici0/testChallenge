import { createFileRoute } from '@tanstack/react-router'

import { requireAuth } from '@/features/auth/guards'

// Esqueleto: substituído pela tela real nesta mesma etapa de telas.
export const Route = createFileRoute('/orders/$orderId')({
  beforeLoad: requireAuth,
  component: () => (
    <main>
      <h1 className="text-h1 font-bold">Pedido</h1>
    </main>
  ),
})
