import { z } from 'zod'

import { ethSchema, imageSchema, isoDateSchema, networkSchema, pageInfoSchema } from './common'

export const categorySchema = z.enum([
  'arte-3d',
  'arte-digital',
  'assinaturas',
  'colecionaveis',
  'fotografia',
  'generativa',
  'jogos',
  'musica',
  'utilidade',
])
export type Category = z.infer<typeof categorySchema>

export const categoryLabels: Record<Category, string> = {
  'arte-3d': 'Arte 3D',
  'arte-digital': 'Arte digital',
  assinaturas: 'Assinaturas',
  colecionaveis: 'Colecionáveis',
  fotografia: 'Fotografia',
  generativa: 'Generativa',
  jogos: 'Jogos',
  musica: 'Música',
  utilidade: 'Utilidade',
}

export const sortSchema = z.enum(['recent', 'price-asc', 'price-desc', 'name-asc', 'popular'])
export const tabSchema = z.enum(['all', 'new', 'trending'])

/** Aceita valor único ou lista (query string repetida) e normaliza para lista; ausente → []. */
const multiValue = <T extends z.ZodType<string>>(item: T) =>
  z
    .union([z.array(item), item.transform((value) => [value])])
    .default([])
    .catch([])

/** Parâmetros do catálogo — mesmo schema valida a URL (TanStack Router) e a query da API. */
export const nftListParamsSchema = z.object({
  q: z.string().trim().min(1).optional().catch(undefined),
  tab: tabSchema.catch('all').default('all'),
  category: multiValue(categorySchema),
  network: multiValue(networkSchema),
  collection: z.string().optional().catch(undefined),
  priceMin: ethSchema.optional().catch(undefined),
  priceMax: ethSchema.optional().catch(undefined),
  sort: sortSchema.catch('recent').default('recent'),
  page: z.coerce.number().int().positive().catch(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).catch(9).default(9),
})
export type NftListParams = z.infer<typeof nftListParamsSchema>

export const nftSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  collection: z.object({ id: z.string(), name: z.string() }),
  creator: z.object({ id: z.string(), name: z.string() }),
  image: imageSchema,
  category: categorySchema,
  network: networkSchema,
  badge: z.enum(['rare']).nullable(),
  priceFromEth: ethSchema,
  available: z.number().int().nonnegative(),
  version: z.number().int().positive(),
})
export type NftSummary = z.infer<typeof nftSummarySchema>

export const nftListResponseSchema = pageInfoSchema.extend({
  items: z.array(nftSummarySchema),
  appliedFilters: nftListParamsSchema,
})
export type NftListResponse = z.infer<typeof nftListResponseSchema>

export const editionSchema = z.object({
  id: z.string(),
  label: z.string(),
  priceEth: ethSchema,
  supply: z.number().int().positive().nullable(),
  available: z.number().int().nonnegative(),
  maxPerOrder: z.number().int().positive(),
  status: z.enum(['available', 'sold-out', 'unavailable']),
})
export type Edition = z.infer<typeof editionSchema>

export const nftDetailSchema = nftSummarySchema.extend({
  tokenId: z.string(),
  description: z.string(),
  longDescription: z.string(),
  gallery: z.array(imageSchema),
  attributes: z.array(z.object({ trait: z.string(), value: z.string() })),
  rating: z.object({ average: z.number(), count: z.number().int().nonnegative() }),
  reviews: z.array(z.object({ author: z.string(), rating: z.number(), text: z.string(), createdAt: isoDateSchema })),
  contract: z.object({ address: z.string(), standard: z.enum(['ERC-721', 'ERC-1155', 'SPL']) }),
  royaltyPercent: z.number(),
  editions: z.array(editionSchema),
  createdAt: isoDateSchema,
})
export type NftDetail = z.infer<typeof nftDetailSchema>

export const facetSchema = z.object({ id: z.string(), label: z.string(), count: z.number().int().nonnegative() })

export const facetsResponseSchema = z.object({
  categories: z.array(facetSchema),
  networks: z.array(facetSchema),
  priceRange: z.object({ minEth: ethSchema, maxEth: ethSchema }),
})
export type FacetsResponse = z.infer<typeof facetsResponseSchema>

export const featuredResponseSchema = z.object({ items: z.array(nftSummarySchema) })
