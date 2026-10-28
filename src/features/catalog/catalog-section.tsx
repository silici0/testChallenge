import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'

import { categoryLabels, type NftListParams, type NftListResponse } from '@/contracts'
import { FavoriteButton } from '@/features/favorites/favorite-button'
import { isApiError } from '@/shared/api'
import {
  Button,
  EmptyState,
  ErrorState,
  Icon,
  Pagination,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui'

import { facetsQuery, featuredQuery, nftListQuery } from './api'
import { CatalogToolbar } from './components/catalog-toolbar'
import { FeaturedBanner } from './components/editorial'
import { FilterGroup } from './components/filter-group'
import { NftCard } from './components/nft-card'
import { NftGrid } from './components/nft-grid'
import { PriceRangeFilter } from './components/price-range-filter'
import { SearchField } from './components/search-field'

const route = getRouteApi('/')

/** Atualiza a URL: qualquer mudança de filtro reinicia a paginação (enunciado §3.1). */
function useCatalogNavigation() {
  const navigate = route.useNavigate()
  return (patch: Partial<NftListParams>, { replace = false }: { replace?: boolean } = {}) => {
    void navigate({ search: (previous) => ({ ...previous, ...patch, page: patch.page }), replace, resetScroll: false })
  }
}

const toggleValue = <T extends string>(list: T[], value: T, checked: boolean) =>
  checked ? [...list, value] : list.filter((item) => item !== value)

function Filters({ search }: { search: NftListParams }) {
  const update = useCatalogNavigation()
  const { data: facets } = useQuery(facetsQuery(search))
  if (!facets) return <p className="text-label text-foreground-secondary">Carregando filtros…</p>
  return (
    <div className="flex flex-col gap-10">
      <FilterGroup
        legend="Coleções"
        options={facets.categories}
        selected={search.category}
        onToggle={(id, checked) => {
          update({ category: toggleValue(search.category, id as NftListParams['category'][number], checked) })
        }}
      />
      <PriceRangeFilter
        key={`${search.priceMin ?? ''}-${search.priceMax ?? ''}`}
        bounds={facets.priceRange}
        value={{ min: search.priceMin, max: search.priceMax }}
        onApply={({ min, max }) => {
          update({ priceMin: min, priceMax: max })
        }}
      />
      <FilterGroup
        legend="Rede"
        options={facets.networks}
        selected={search.network}
        onToggle={(id, checked) => {
          update({ network: toggleValue(search.network, id as NftListParams['network'][number], checked) })
        }}
      />
    </div>
  )
}

const hasFilters = (search: NftListParams) =>
  [search.q, search.priceMin, search.priceMax].some(Boolean) ||
  search.category.length > 0 ||
  search.network.length > 0 ||
  search.tab !== 'all'

function EmptyResults({ search }: { search: NftListParams }) {
  return (
    <EmptyState
      title="Nenhum NFT encontrado"
      description={
        search.q
          ? `Nada corresponde a “${search.q}” com os filtros atuais.`
          : 'Ajuste os filtros para ver mais resultados.'
      }
      action={
        hasFilters(search) && (
          <Button variant="outline" asChild>
            <Link to="/" hash="catalogo">
              Limpar filtros
            </Link>
          </Button>
        )
      }
    />
  )
}

function ResultList({
  data,
  isLoading,
  isPlaceholder,
}: {
  data: NftListResponse | undefined
  isLoading: boolean
  isPlaceholder: boolean
}) {
  return (
    <>
      <NftGrid
        items={data?.items}
        isLoading={isLoading}
        isFetching={isPlaceholder}
        renderCard={(nft, index) => (
          <NftCard
            nft={nft}
            priority={index < 3}
            action={<FavoriteButton nftId={nft.id} nftName={nft.name} />}
            renderLink={(props) => <Link to="/nfts/$nftId" params={{ nftId: nft.id }} {...props} />}
          />
        )}
      />
      {data && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          renderLink={({ page, ...props }) => (
            <Link to="/" search={(previous) => ({ ...previous, page })} hash="catalogo" {...props} />
          )}
        />
      )}
      <p className="sr-only" role="status">
        {data ? `${data.total} ${data.total === 1 ? 'resultado' : 'resultados'}` : ''}
      </p>
    </>
  )
}

function Results({ search }: { search: NftListParams }) {
  const list = useQuery(nftListQuery(search))
  const retry = () => {
    void list.refetch()
  }
  if (list.isError && !list.data) {
    const transient = isApiError(list.error) && list.error.retryable
    return (
      <ErrorState
        title="Não foi possível carregar o catálogo"
        description={transient ? 'Verifique sua conexão e tente novamente.' : 'Tente novamente em instantes.'}
        onRetry={retry}
        isRetrying={list.isFetching}
      />
    )
  }
  if (list.data?.total === 0) return <EmptyResults search={search} />
  return (
    <div className="flex flex-col gap-section">
      <ResultList data={list.data} isLoading={list.isPending} isPlaceholder={list.isPlaceholderData} />
      {list.isError && (
        <p role="alert" className="text-label text-danger-text">
          Não foi possível atualizar a lista.{' '}
          <button type="button" className="underline" onClick={retry}>
            Tentar novamente
          </button>
        </p>
      )}
    </div>
  )
}

function ActiveFilters({ search }: { search: NftListParams }) {
  const labels = [...search.category.map((category) => categoryLabels[category]), ...search.network]
  if (labels.length === 0) return null
  return <p className="text-caption text-foreground-secondary">Filtros: {labels.join(', ')}</p>
}

function MobileFilters({ search }: { search: NftListParams }) {
  const update = useCatalogNavigation()
  return (
    <div className="flex gap-3 lg:hidden">
      <div className="flex-1">
        <SearchField
          value={search.q ?? ''}
          onSearch={(term, { commit }) => {
            update({ q: term || undefined }, { replace: !commit })
          }}
        />
      </div>
      <Sheet>
        <SheetTrigger asChild>
          <Button aria-label="Abrir filtros" className="size-11 px-0">
            <Icon name="filter" size={20} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="overflow-y-auto bg-background p-6">
          <SheetHeader className="p-0">
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription>Coleções, faixa de preço e rede.</SheetDescription>
          </SheetHeader>
          <Filters search={search} />
        </SheetContent>
      </Sheet>
    </div>
  )
}

/** Catálogo da Início: estado inteiro na URL (refresh, histórico e compartilhamento). */
export function CatalogSection() {
  const search = route.useSearch()
  const update = useCatalogNavigation()
  const { data: featured } = useQuery(featuredQuery())
  const highlight = featured?.items[3]

  return (
    <section
      id="catalogo"
      aria-labelledby="catalog-title"
      className="grid scroll-mt-8 gap-12 lg:grid-cols-[theme(--container-sidebar)_1fr]"
    >
      <h2 id="catalog-title" className="sr-only">
        Catálogo de NFTs
      </h2>
      <aside className="hidden flex-col gap-6 lg:flex" aria-label="Filtros">
        <div className="rounded-sm bg-surface p-5">
          <Filters search={search} />
        </div>
        <FeaturedBanner
          nft={highlight}
          renderLink={(props) => <Link to="/nfts/$nftId" params={{ nftId: highlight?.id ?? '' }} {...props} />}
        />
      </aside>
      <div className="flex min-w-0 flex-col gap-8">
        <MobileFilters search={search} />
        <CatalogToolbar
          tab={search.tab}
          sort={search.sort}
          onSortChange={(sort) => {
            update({ sort })
          }}
          renderTabLink={({ tab, ...props }) => (
            <Link
              to="/"
              search={(previous) => ({ ...previous, tab, page: undefined })}
              resetScroll={false}
              {...props}
            />
          )}
        />
        <ActiveFilters search={search} />
        <Results search={search} />
      </div>
    </section>
  )
}
