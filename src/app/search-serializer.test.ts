import { describe, expect, it } from 'vitest'

import { parseSearch, stringifySearch } from './search-serializer'

describe('serialização da URL', () => {
  it('arrays viram parâmetros repetidos (mesmo formato da API)', () => {
    expect(stringifySearch({ category: ['musica', 'jogos'], page: 2, q: 'ape' })).toBe(
      '?category=musica&category=jogos&page=2&q=ape',
    )
  })

  it('omite vazios e retorna string vazia sem parâmetros', () => {
    expect(stringifySearch({ category: [], q: undefined })).toBe('')
  })

  it('lê repetidos como array e únicos como valor simples (o schema normaliza)', () => {
    expect(parseSearch('?category=musica&category=jogos&page=2')).toEqual({ category: ['musica', 'jogos'], page: '2' })
    expect(parseSearch('?redirect=%2Fcart%3Fx%3D1')).toEqual({ redirect: '/cart?x=1' })
  })

  it('ida e volta preserva o significado', () => {
    const search = { category: ['arte-3d'], sort: 'price-asc' }
    expect(parseSearch(stringifySearch(search))).toEqual({ category: 'arte-3d', sort: 'price-asc' })
  })
})
