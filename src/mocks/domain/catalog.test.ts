// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { nftListParamsSchema } from '@/contracts'

import { getFacets, listNfts } from './catalog'
import { createTestDatabase } from './test-utils'

const params = (input: Record<string, unknown> = {}) => nftListParamsSchema.parse(input)

describe('catálogo simulado', () => {
  it('pagina 63 NFTs em 7 páginas de 9', async () => {
    const { db } = await createTestDatabase()
    const page = db.read((state) => listNfts(state, params({ page: 7 })))
    expect(page).toMatchObject({ total: 63, totalPages: 7, page: 7 })
    expect(page.items).toHaveLength(9)
  })

  it('combina filtros (categoria + rede) e ecoa os parâmetros aplicados', async () => {
    const { db } = await createTestDatabase()
    const result = db.read((state) => listNfts(state, params({ category: ['musica', 'jogos'], network: 'polygon' })))
    expect(result.total).toBeGreaterThan(0)
    expect(result.items.every((nft) => ['musica', 'jogos'].includes(nft.category) && nft.network === 'polygon')).toBe(
      true,
    )
    expect(result.appliedFilters.category).toEqual(['musica', 'jogos'])
  })

  it('busca sem diferenciar acentos e maiúsculas', async () => {
    const { db } = await createTestDatabase()
    const result = db.read((state) => listNfts(state, params({ q: 'emerald' })))
    expect(result.items.map((nft) => nft.name)).toContain('Emerald Ape #042')
  })

  it('ordena por preço de forma estável', async () => {
    const { db } = await createTestDatabase()
    const prices = db.read((state) =>
      listNfts(state, params({ sort: 'price-asc', pageSize: 48 })).items.map((nft) => Number(nft.priceFromEth)),
    )
    expect(prices).toEqual([...prices].sort((a, b) => a - b))
  })

  it('facetas por categoria ignoram o próprio filtro de categoria', async () => {
    const { db } = await createTestDatabase()
    const facets = db.read((state) => getFacets(state, params({ category: ['musica'] })))
    expect(facets.categories.reduce((sum, facet) => sum + facet.count, 0)).toBe(63)
    expect(facets.categories.map((facet) => facet.label)).toEqual(
      [...facets.categories.map((facet) => facet.label)].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    )
  })

  it('resultado vazio é válido', async () => {
    const { db } = await createTestDatabase()
    expect(db.read((state) => listNfts(state, params({ q: 'nao-existe' }))).total).toBe(0)
  })
})
