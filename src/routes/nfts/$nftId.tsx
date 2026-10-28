import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { nftDetailQuery } from '@/features/nft/api'
import { NftDetailPage } from '@/features/nft/nft-detail-page'

export const Route = createFileRoute('/nfts/$nftId')({
  validateSearch: z.object({ edition: z.string().optional().catch(undefined) }),
  // Pré-carrega sem bloquear (skeleton enquanto carrega); 404 vira estado próprio na página.
  loader: ({ context, params }) => {
    void context.queryClient.query(nftDetailQuery(params.nftId)).catch(() => undefined)
  },
  component: NftDetailPage,
})
