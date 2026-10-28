import { serializeParams } from '@/shared/api'

/**
 * Query string legível e igual à da API: `?category=musica&category=jogos` em vez de JSON.
 * Valores voltam como string/array; os schemas Zod de cada rota fazem a coerção e a validação.
 */
export function stringifySearch(search: Record<string, unknown>): string {
  const query = serializeParams(search)
  return query ? `?${query}` : ''
}

export function parseSearch(searchString: string): Record<string, unknown> {
  const params = new URLSearchParams(searchString)
  const result: Record<string, unknown> = {}
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key)
    result[key] = values.length > 1 ? values : values[0]
  }
  return result
}
