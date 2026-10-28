import { createFileRoute } from '@tanstack/react-router'

// Esqueleto: substituído pela tela real nesta mesma etapa de telas.
export const Route = createFileRoute('/checkout')({
  component: () => (
    <main>
      <h1 className="text-h1 font-bold">Pagamento</h1>
    </main>
  ),
})
