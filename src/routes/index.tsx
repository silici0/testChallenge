import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <main>
      <h1 className="text-display font-bold">SEJA DONO DO FUTURO DA ARTE DIGITAL</h1>
    </main>
  )
}
