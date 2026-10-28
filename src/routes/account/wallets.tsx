import { createFileRoute } from '@tanstack/react-router'

import { WalletsPage } from '@/features/wallets/wallets-page'

export const Route = createFileRoute('/account/wallets')({
  head: () => ({ meta: [{ title: 'Carteiras — Kurio' }] }),
  component: WalletsPage,
})
