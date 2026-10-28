import { useQuery } from '@tanstack/react-query'
import { Link, useRouteContext } from '@tanstack/react-router'

import { NftCard } from '@/features/catalog/components/nft-card'
import { NftGrid } from '@/features/catalog/components/nft-grid'
import { favoritesQuery } from '@/features/favorites/api'
import { FavoriteButton } from '@/features/favorites/favorite-button'
import { Button, EmptyState, ErrorState } from '@/shared/ui'

export function FavoritesPage() {
  const { user } = useRouteContext({ from: '/account' })
  const favorites = useQuery(favoritesQuery(user.id))
  return (
    <section aria-labelledby="favorites-title" className="flex flex-col gap-6">
      <h1 id="favorites-title" className="text-body-lg font-bold text-foreground">
        Lista de interesse
      </h1>
      {favorites.isError && !favorites.data && (
        <ErrorState title="Não foi possível carregar os favoritos" onRetry={() => void favorites.refetch()} />
      )}
      {favorites.data?.items.length === 0 ? (
        <EmptyState
          title="Nenhum favorito ainda"
          description="Toque no coração de um NFT para acompanhá-lo aqui."
          action={
            <Button asChild variant="outline">
              <Link to="/" hash="catalogo">
                Explorar NFTs
              </Link>
            </Button>
          }
        />
      ) : (
        <NftGrid
          items={favorites.data?.items}
          isLoading={favorites.isPending}
          skeletonCount={3}
          renderCard={(nft) => (
            <NftCard
              nft={nft}
              action={<FavoriteButton nftId={nft.id} nftName={nft.name} />}
              renderLink={(props) => <Link to="/nfts/$nftId" params={{ nftId: nft.id }} {...props} />}
            />
          )}
        />
      )}
    </section>
  )
}
