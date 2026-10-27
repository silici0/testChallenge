import type { FacetsResponse, NftDetail, NftListParams, NftListResponse, NftSummary } from '@/contracts'
import { categoryLabels, networkSchema } from '@/contracts'
import { compareEth, parseEth } from '@/shared/lib/money'

import type { DbState, NftRecord } from '../db/schema'
import { nftPriceFrom } from '../fixtures/nfts'
import { requireFound } from './context'

const NETWORK_LABELS = { ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana' } as const
const NEW_RELEASES = 18
const TRENDING_MIN_POPULARITY = 600

const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export const totalAvailable = (nft: NftRecord) => nft.editions.reduce((sum, edition) => sum + edition.available, 0)

export function toNftSummary(nft: NftRecord): NftSummary {
  return {
    id: nft.id,
    name: nft.name,
    collection: nft.collection,
    creator: nft.creator,
    image: nft.image,
    category: nft.category,
    network: nft.network,
    badge: nft.badge,
    priceFromEth: nftPriceFrom(nft.editions),
    available: totalAvailable(nft),
    version: nft.version,
  }
}

export function toNftDetail(nft: NftRecord): NftDetail {
  const { popularity: _popularity, ...detail } = nft
  return { ...detail, ...toNftSummary(nft) }
}

type Filter = (nft: NftRecord, newestIds: Set<string>) => boolean

const TAB_FILTERS: Record<NftListParams['tab'], Filter | null> = {
  all: null,
  new: (nft, newest) => newest.has(nft.id),
  trending: (nft) => nft.popularity >= TRENDING_MIN_POPULARITY,
}

function textFilter(q: string | undefined): Filter | null {
  if (!q) return null
  const term = normalize(q)
  return (nft) => [nft.name, nft.collection.name, nft.creator.name].some((field) => normalize(field).includes(term))
}

function priceFilters({ priceMin, priceMax }: NftListParams): Filter[] {
  const filters: Filter[] = []
  if (priceMin) filters.push((nft) => compareEth(nftPriceFrom(nft.editions), priceMin) >= 0)
  if (priceMax) filters.push((nft) => compareEth(nftPriceFrom(nft.editions), priceMax) <= 0)
  return filters
}

function buildFilters(params: NftListParams, skip?: 'category' | 'network'): Filter[] {
  const { category, network, collection } = params
  const filters: (Filter | null)[] = [
    textFilter(params.q),
    TAB_FILTERS[params.tab],
    skip !== 'category' && category.length > 0 ? (nft) => category.includes(nft.category) : null,
    skip !== 'network' && network.length > 0 ? (nft) => network.includes(nft.network) : null,
    collection ? (nft) => nft.collection.id === collection : null,
    ...priceFilters(params),
  ]
  return filters.filter((filter): filter is Filter => filter !== null)
}

const newestIds = (db: DbState) =>
  new Set(
    [...db.nfts]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, NEW_RELEASES)
      .map((nft) => nft.id),
  )

function applyFilters(db: DbState, params: NftListParams, skip?: 'category' | 'network') {
  const filters = buildFilters(params, skip)
  const newest = newestIds(db)
  return db.nfts.filter((nft) => filters.every((filter) => filter(nft, newest)))
}

const byId = (a: NftRecord, b: NftRecord) => a.id.localeCompare(b.id)
const priceOf = (nft: NftRecord) => parseEth(nftPriceFrom(nft.editions))
const comparePrice = (a: NftRecord, b: NftRecord) => {
  const difference = priceOf(a) - priceOf(b)
  if (difference === 0n) return 0
  return difference < 0n ? -1 : 1
}

const SORTERS: Record<NftListParams['sort'], (a: NftRecord, b: NftRecord) => number> = {
  recent: (a, b) => b.createdAt.localeCompare(a.createdAt) || byId(a, b),
  'price-asc': (a, b) => comparePrice(a, b) || byId(a, b),
  'price-desc': (a, b) => comparePrice(b, a) || byId(a, b),
  'name-asc': (a, b) => a.name.localeCompare(b.name, 'pt-BR') || byId(a, b),
  popular: (a, b) => b.popularity - a.popularity || byId(a, b),
}

export function listNfts(db: DbState, params: NftListParams): NftListResponse {
  const matches = applyFilters(db, params).sort(SORTERS[params.sort])
  const totalPages = Math.ceil(matches.length / params.pageSize)
  const start = (params.page - 1) * params.pageSize
  return {
    items: matches.slice(start, start + params.pageSize).map(toNftSummary),
    page: params.page,
    pageSize: params.pageSize,
    total: matches.length,
    totalPages,
    appliedFilters: params,
  }
}

/** Contagens facetadas: cada grupo considera os filtros dos outros grupos. */
export function getFacets(db: DbState, params: NftListParams): FacetsResponse {
  const forCategories = applyFilters(db, params, 'category')
  const forNetworks = applyFilters(db, params, 'network')
  const prices = db.nfts.map((nft) => nftPriceFrom(nft.editions)).sort(compareEth)
  return {
    categories: (Object.keys(categoryLabels) as (keyof typeof categoryLabels)[])
      .map((id) => ({
        id,
        label: categoryLabels[id],
        count: forCategories.filter((nft) => nft.category === id).length,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),
    networks: networkSchema.options.map((id) => ({
      id,
      label: NETWORK_LABELS[id],
      count: forNetworks.filter((nft) => nft.network === id).length,
    })),
    priceRange: { minEth: prices[0] ?? '0', maxEth: prices[prices.length - 1] ?? '0' },
  }
}

export function getFeatured(db: DbState): NftSummary[] {
  return [...db.nfts].sort(SORTERS.popular).slice(0, 6).map(toNftSummary)
}

export const findNft = (db: DbState, nftId: string) =>
  requireFound(
    db.nfts.find((nft) => nft.id === nftId),
    'NFT',
  )

export function getNftDetail(db: DbState, nftId: string): NftDetail {
  return toNftDetail(findNft(db, nftId))
}

/** Evento público de alteração de preço/disponibilidade (mesma versão exposta pela API REST). */
export const nftUpdatedEvent = (nft: NftRecord) => ({
  type: 'nft.updated' as const,
  resource: { type: 'nft' as const, id: nft.id },
  version: nft.version,
  userId: null,
  data: {
    priceFromEth: nftPriceFrom(nft.editions),
    available: totalAvailable(nft),
    editions: nft.editions.map(({ id, priceEth, available, status }) => ({ id, priceEth, available, status })),
  },
})
