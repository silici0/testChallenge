import { nftListParamsSchema } from '@/contracts'

import { getFacets, getFeatured, getNftDetail, listNfts } from '../../domain/catalog'
import { createRoute, type MockServices } from '../responder'

const listParams = (request: Request) => {
  const search = new URL(request.url).searchParams
  const raw: Record<string, unknown> = {}
  for (const key of new Set(search.keys())) {
    const values = search.getAll(key)
    raw[key] = ['category', 'network'].includes(key) ? values : values[0]
  }
  return nftListParamsSchema.parse(raw)
}

export function catalogRoutes(services: MockServices) {
  const { route } = createRoute(services)
  const isEmpty = () => services.scenarios.scenario.emptyCatalog === true
  const emptyPage = (params: ReturnType<typeof listParams>) => ({
    items: [],
    page: params.page,
    pageSize: params.pageSize,
    total: 0,
    totalPages: 0,
    appliedFilters: params,
  })

  return [
    route('get', '/nfts', ({ request }) => {
      const params = listParams(request)
      return Promise.resolve(isEmpty() ? emptyPage(params) : services.db.read((db) => listNfts(db, params)))
    }),
    route('get', '/nfts/featured', () => Promise.resolve({ items: isEmpty() ? [] : services.db.read(getFeatured) })),
    route('get', '/nfts/facets', ({ request }) =>
      Promise.resolve(services.db.read((db) => getFacets(db, listParams(request)))),
    ),
    route('get', '/nfts/:nftId', ({ params }) =>
      Promise.resolve(services.db.read((db) => getNftDetail(db, String(params.nftId)))),
    ),
  ]
}
