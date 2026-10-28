import { createFileRoute } from '@tanstack/react-router'

import { FavoritesPage } from '@/features/account/favorites-page'

export const Route = createFileRoute('/account/favorites')({
  head: () => ({ meta: [{ title: 'Lista de interesse — Kurio' }] }),
  component: FavoritesPage,
})
