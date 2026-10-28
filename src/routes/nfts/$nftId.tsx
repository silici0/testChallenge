import { createFileRoute } from '@tanstack/react-router'

// Esqueleto: substituído pela tela real nesta mesma etapa de telas.
export const Route = createFileRoute('/nfts/$nftId')({
  component: () => (
    <main>
      <h1 className="text-h1 font-bold">Detalhes do NFT</h1>
    </main>
  ),
})
