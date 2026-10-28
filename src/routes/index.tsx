import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, stripSearchParams } from '@tanstack/react-router'

import { type NftListParams, nftListParamsSchema } from '@/contracts'
import { facetsQuery, featuredQuery, nftListQuery } from '@/features/catalog/api'
import { CatalogSection } from '@/features/catalog/catalog-section'
import { BlogSection, PromoCard } from '@/features/catalog/components/editorial'
import { Hero } from '@/features/catalog/components/hero'
import { Button, Icon } from '@/shared/ui'

const SEARCH_DEFAULTS: Partial<NftListParams> = {
  tab: 'all',
  sort: 'recent',
  page: 1,
  pageSize: 9,
  category: [],
  network: [],
}

export const Route = createFileRoute('/')({
  validateSearch: nftListParamsSchema,
  // URLs canônicas: valores padrão não aparecem na query string.
  search: { middlewares: [stripSearchParams(SEARCH_DEFAULTS)] },
  loaderDeps: ({ search }) => search,
  // Pré-carrega sem bloquear: a tela mostra skeletons enquanto os dados chegam.
  loader: ({ context, deps }) => {
    const ignore = () => undefined
    void context.queryClient.query(nftListQuery(deps)).catch(ignore)
    void context.queryClient.query(facetsQuery(deps)).catch(ignore)
    void context.queryClient.query(featuredQuery()).catch(ignore)
  },
  head: () => ({ meta: [{ title: 'Kurio — Marketplace de NFTs' }] }),
  component: HomePage,
})

function HomePage() {
  const { data: featured } = useQuery(featuredQuery())
  const items = featured?.items
  return (
    <div className="flex flex-col gap-section">
      <Hero
        slides={items?.slice(0, 3)}
        cta={
          <Button asChild uppercase>
            <Link to="/" hash="catalogo">
              Explorar
            </Link>
          </Button>
        }
      />
      <CatalogSection />
      <section aria-label="Lançamentos e curadoria" className="grid gap-7 lg:grid-cols-2">
        <PromoCard
          title="Lançamentos gênesis de edição limitada"
          description="Colecione edições escassas diretamente dos criadores antes da revelação pública."
          nft={items?.[0]}
          cta={
            <Button asChild>
              <Link to="/" search={{ tab: 'new' }} hash="catalogo">
                Explorar <Icon name="arrow-right" size={16} />
              </Link>
            </Button>
          }
        />
        <PromoCard
          title="Arte digital selecionada e muito mais"
          description="Explore novos artistas, coleções verificadas e obras digitais que definem a cultura."
          nft={items?.[2]}
          cta={
            <Button asChild>
              <Link to="/" search={{ category: ['arte-digital'] }} hash="catalogo">
                Explorar <Icon name="arrow-right" size={16} />
              </Link>
            </Button>
          }
        />
      </section>
      <BlogSection covers={items?.slice(0, 4)} />
    </div>
  )
}
