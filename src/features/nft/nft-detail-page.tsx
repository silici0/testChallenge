import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { type NftDetail, nftListParamsSchema } from '@/contracts'
import { useCartMutations } from '@/features/cart/use-cart-mutations'
import { nftListQuery } from '@/features/catalog/api'
import { NftCard } from '@/features/catalog/components/nft-card'
import { FavoriteButton } from '@/features/favorites/favorite-button'
import { isApiError } from '@/shared/api'
import { Breadcrumb, Button, EmptyState, ErrorState, EthAmount, Skeleton, SkeletonRegion } from '@/shared/ui'

import { nftDetailQuery } from './api'
import { Gallery } from './components/gallery'
import { NftFacts, NftTabs, ShareLinks } from './components/nft-info'
import { PurchasePanel } from './components/purchase-panel'
import { Rating } from './components/rating'
import { useNftSubscription } from './use-nft-subscription'

const route = getRouteApi('/nfts/$nftId')

/** Maior tiragem finita disponível primeiro (1/50 no Figma); edição aberta por último. */
const bySupply = (edition: NftDetail['editions'][number]) => edition.supply ?? -1

/** Edição pedida na URL ou a padrão (disponível, de maior tiragem finita). */
const pickEdition = (nft: NftDetail, requested: string | undefined) =>
  nft.editions.find((edition) => edition.id === requested) ??
  [...nft.editions].filter((edition) => edition.available > 0).sort((a, b) => bySupply(b) - bySupply(a))[0] ??
  nft.editions[0]

function DetailSkeleton() {
  return (
    <SkeletonRegion label="Carregando NFT" className="grid gap-10 lg:grid-cols-[564px_1fr]">
      <Skeleton className="aspect-square w-full rounded-sm" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-7 w-1/4" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-9 w-1/2" />
        <Skeleton className="h-10 w-full" />
      </div>
    </SkeletonRegion>
  )
}

function useBuyActions(nft: NftDetail, editionId: string | undefined) {
  const navigate = useNavigate()
  const { add } = useCartMutations()
  const [quantity, setQuantity] = useState(1)
  const addToCart = (goToCart: boolean) => {
    if (!editionId) return
    add.mutate(
      { nftId: nft.id, editionId, quantity },
      {
        onSuccess: () => {
          if (goToCart) void navigate({ to: '/cart' })
        },
      },
    )
  }
  const error = isApiError(add.error)
    ? (add.error.fieldErrors.quantity?.[0] ?? 'Não foi possível adicionar ao carrinho. Tente novamente.')
    : undefined
  return { quantity, setQuantity, addToCart, isPending: add.isPending, error }
}

function Related({ nft }: { nft: NftDetail }) {
  const { data } = useQuery(nftListQuery(nftListParamsSchema.parse({ collection: nft.collection.id, pageSize: 6 })))
  const items = data?.items.filter((item) => item.id !== nft.id).slice(0, 5)
  if (!items?.length) return null
  return (
    <section aria-labelledby="related-title" className="flex flex-col gap-8">
      <h2 id="related-title" className="border-b border-border-soft pb-3 text-body-lg font-bold text-primary">
        Mais desta coleção
      </h2>
      <ul className="flex snap-x gap-6 overflow-x-auto pb-2 lg:grid lg:grid-cols-5 lg:overflow-visible">
        {items.map((item) => (
          <li key={item.id} className="w-44 shrink-0 snap-start lg:w-auto">
            <NftCard
              nft={item}
              renderLink={(props) => <Link to="/nfts/$nftId" params={{ nftId: item.id }} {...props} />}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

function DetailContent({ nft }: { nft: NftDetail }) {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  // Seleção imediata na UI; a URL acompanha (replace) para refresh e link direto.
  const [selected, setSelected] = useState(search.edition)
  const edition = pickEdition(nft, selected)
  const buy = useBuyActions(nft, edition?.id)
  useNftSubscription([nft.id])

  return (
    <div className="flex flex-col gap-section pb-48 lg:pb-0">
      <div className="grid gap-10 lg:grid-cols-[564px_1fr]">
        <Gallery name={nft.name} images={nft.gallery} />
        <div className="flex flex-col gap-5">
          <header className="flex flex-col gap-3 border-b border-border-soft pb-4">
            <h1 className="text-h1 font-bold text-foreground">{nft.name}</h1>
            <div className="flex flex-wrap items-center justify-between gap-3">
              {edition && <EthAmount value={edition.priceEth} size="lg" />}
              <Rating average={nft.rating.average} count={nft.rating.count} />
            </div>
          </header>
          <section aria-labelledby="about-title" className="flex flex-col gap-2">
            <h2 id="about-title" className="text-label font-bold text-foreground">
              Sobre este NFT:
            </h2>
            <p className="text-label leading-6 text-foreground-secondary">{nft.description}</p>
          </section>
          <PurchasePanel
            nftName={nft.name}
            editions={nft.editions}
            edition={edition}
            onEditionChange={(editionId) => {
              setSelected(editionId)
              void navigate({ search: { edition: editionId }, replace: true, resetScroll: false })
            }}
            quantity={buy.quantity}
            onQuantityChange={buy.setQuantity}
            onBuy={() => {
              buy.addToCart(true)
            }}
            onAddToCart={() => {
              buy.addToCart(false)
            }}
            isSubmitting={buy.isPending}
            error={buy.error}
            favorite={<FavoriteButton nftId={nft.id} nftName={nft.name} appearance="full" />}
          />
          <div className="lg:hidden">
            <FavoriteButton nftId={nft.id} nftName={nft.name} appearance="full" />
          </div>
          <NftFacts nft={nft} />
          <ShareLinks name={nft.name} />
        </div>
      </div>
      <NftTabs nft={nft} />
      <Related nft={nft} />
    </div>
  )
}

export function NftDetailPage() {
  const { nftId } = route.useParams()
  const query = useQuery(nftDetailQuery(nftId))

  const breadcrumb = (
    <Breadcrumb
      items={[
        { label: 'Início', render: (props) => <Link to="/" {...props} /> },
        { label: 'Mercado', render: (props) => <Link to="/" hash="catalogo" {...props} /> },
        { label: query.data?.name ?? 'NFT' },
      ]}
    />
  )

  if (query.isError && isApiError(query.error) && query.error.is('NOT_FOUND')) {
    return (
      <EmptyState
        titleAs="h1"
        title="NFT não encontrado"
        description="Ele pode ter sido removido ou o endereço está incorreto."
        action={
          <Button asChild variant="outline">
            <Link to="/" hash="catalogo">
              Voltar ao catálogo
            </Link>
          </Button>
        }
      />
    )
  }
  return (
    <div className="flex flex-col gap-6">
      {breadcrumb}
      {query.isError && !query.data && (
        <ErrorState
          title="Não foi possível carregar este NFT"
          onRetry={() => void query.refetch()}
          isRetrying={query.isFetching}
        />
      )}
      {query.isPending && <DetailSkeleton />}
      {query.data && <DetailContent nft={query.data} />}
    </div>
  )
}
