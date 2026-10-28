import { createFileRoute, Link } from '@tanstack/react-router'

import { Button, EmptyState } from '@/shared/ui'

/** Explorador simulado: referências de transação não existem numa blockchain real (§3.3). */
export const Route = createFileRoute('/explorer/tx/$hash')({
  head: () => ({ meta: [{ title: 'Transação simulada — Kurio' }] }),
  component: function ExplorerPage() {
    const { hash } = Route.useParams()
    return (
      <EmptyState
        title="Transação simulada"
        description={`A transação ${hash} foi gerada pela demonstração e não existe em uma blockchain real.`}
        action={
          <Button asChild variant="outline">
            <Link to="/">Voltar ao início</Link>
          </Button>
        }
      />
    )
  },
})
