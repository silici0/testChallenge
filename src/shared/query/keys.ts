import type { Network, NftListParams } from '@/contracts'

/**
 * Fábrica central de query keys (docs/cache-strategy.md). Tudo que é privado fica sob ['user', userId],
 * o que permite remover os dados da sessão anterior com uma única chamada no logout/troca de usuário.
 */
const LIST_DEFAULTS: Partial<NftListParams> = { tab: 'all', sort: 'recent', page: 1, pageSize: 9 }

/** Remove padrões e ordena arrays: URLs equivalentes compartilham o mesmo cache. */
export function normalizeListParams(params: NftListParams): Partial<NftListParams> {
  const normalized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(params) as [keyof NftListParams, unknown][]) {
    if (value === undefined || LIST_DEFAULTS[key] === value) continue
    if (Array.isArray(value)) {
      if (value.length > 0) normalized[key] = [...(value as string[])].sort()
      continue
    }
    normalized[key] = value
  }
  return normalized
}

export const queryKeys = {
  session: () => ['session'] as const,
  nfts: {
    all: () => ['nfts'] as const,
    lists: () => ['nfts', 'list'] as const,
    list: (params: NftListParams) => ['nfts', 'list', normalizeListParams(params)] as const,
    facets: (params: NftListParams) => ['nfts', 'facets', normalizeListParams({ ...params, page: 1 })] as const,
    featured: () => ['nfts', 'featured'] as const,
    detail: (nftId: string) => ['nfts', 'detail', nftId] as const,
  },
  guestCart: (guestCartId: string) => ['cart', 'guest', guestCartId] as const,
  user: {
    all: () => ['user'] as const,
    scope: (userId: string) => ['user', userId] as const,
    favorites: (userId: string) => ['user', userId, 'favorites'] as const,
    cart: (userId: string) => ['user', userId, 'cart'] as const,
    quote: (userId: string, network: Network) => ['user', userId, 'quote', network] as const,
    orders: (userId: string) => ['user', userId, 'orders'] as const,
    order: (userId: string, orderId: string) => ['user', userId, 'orders', orderId] as const,
    pendingOrders: (userId: string) => ['user', userId, 'orders', { status: 'pending' }] as const,
    profile: (userId: string) => ['user', userId, 'profile'] as const,
    wallets: (userId: string) => ['user', userId, 'wallets'] as const,
  },
}
