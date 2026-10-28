import type { QueryClient } from '@tanstack/react-query'

import type {
  Cart,
  NftDetail,
  NftListResponse,
  NftSummary,
  NftUpdatedEvent,
  Order,
  OrderUpdatedEvent,
  RealtimeEvent,
} from '@/contracts'
import { queryKeys } from '@/shared/query'
import { type EventGate, resourceKey } from '@/shared/realtime'

export type Announce = (message: string, politeness: 'polite' | 'assertive') => void

interface RealtimeSyncOptions {
  queryClient: QueryClient
  gate: EventGate
  getUserId: () => string | null
  announce: Announce
}

const isVersioned = (value: unknown): value is { id: string; version: number } =>
  typeof value === 'object' && value !== null && 'id' in value && 'version' in value

const applyNftToSummary = <T extends Pick<NftSummary, 'id' | 'version' | 'priceFromEth' | 'available'>>(
  item: T,
  event: NftUpdatedEvent,
): T =>
  item.id === event.resource.id && item.version < event.version
    ? { ...item, version: event.version, priceFromEth: event.data.priceFromEth, available: event.data.available }
    : item

/**
 * Traduz eventos aceitos pelo EventGate em atualizações do cache do TanStack Query (enunciado §7).
 * A API REST continua sendo a fonte de verdade: eventos aceleram, a reconciliação corrige lacunas.
 */
export function createRealtimeSync({ queryClient, gate, getUserId, announce }: RealtimeSyncOptions) {
  const userCart = (userId: string) => queryClient.getQueryData<Cart>(queryKeys.user.cart(userId))

  function onNftUpdated(event: NftUpdatedEvent) {
    const detailKey = queryKeys.nfts.detail(event.resource.id)
    queryClient.setQueryData<NftDetail>(detailKey, (detail) => {
      if (!detail || detail.version >= event.version) return detail
      const editions = detail.editions.map((edition) => {
        const update = event.data.editions.find((candidate) => candidate.id === edition.id)
        return update ? { ...edition, ...update } : edition
      })
      return { ...applyNftToSummary(detail, event), editions }
    })
    queryClient.setQueriesData<NftListResponse | { items: NftSummary[] }>({ queryKey: queryKeys.nfts.all() }, (data) =>
      data && 'items' in data ? { ...data, items: data.items.map((item) => applyNftToSummary(item, event)) } : data,
    )

    const userId = getUserId()
    const cartItem = userId ? userCart(userId)?.items.find((item) => item.nftId === event.resource.id) : undefined
    if (userId && cartItem) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.user.cart(userId) })
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.user.scope(userId), 'quote'] })
      announce(`${cartItem.nft.name} teve preço ou disponibilidade alterados. O resumo foi atualizado.`, 'polite')
    }
  }

  function onOrderUpdated(event: OrderUpdatedEvent, userId: string) {
    queryClient.setQueryData<Order>(queryKeys.user.order(userId, event.resource.id), (order) =>
      order && order.version < event.version ? { ...order, ...event.data, version: event.version } : order,
    )
    if (event.data.status === 'pending') return
    void queryClient.invalidateQueries({ queryKey: queryKeys.user.cart(userId) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.user.pendingOrders(userId) })
    announce(
      event.data.status === 'confirmed'
        ? 'Pagamento confirmado.'
        : 'Pagamento recusado. Seus itens continuam no carrinho.',
      'assertive',
    )
  }

  function handle(event: RealtimeEvent) {
    const userId = getUserId()
    if (!gate.accept(event, userId)) return
    if (event.type === 'nft.updated') onNftUpdated(event)
    else if (event.type === 'order.updated' && userId) onOrderUpdated(event, userId)
    else if (event.type === 'wallet.updated' && userId) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.user.wallets(userId) })
      if (event.data.connection === 'disconnected') announce('Sua carteira foi desconectada.', 'assertive')
    }
  }

  /** Versões vistas via REST alimentam o gate: eventos mais antigos que o REST são descartados. */
  function recordRestVersions() {
    const record = (query: { queryKey: readonly unknown[]; state: { data: unknown } }) => {
      const [scope, kind] = query.queryKey
      const data = query.state.data
      if (scope === 'nfts' && kind === 'detail' && isVersioned(data))
        gate.recordVersion(resourceKey({ type: 'nft', id: data.id }), data.version)
      if (scope === 'user' && query.queryKey[2] === 'orders' && isVersioned(data))
        gate.recordVersion(resourceKey({ type: 'order', id: data.id }), data.version)
    }
    for (const query of queryClient.getQueryCache().getAll()) record(query)
    return queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.action.type === 'success') record(event.query)
    })
  }

  /** Após reconexão: os recursos em tela são reconciliados com a API REST. */
  function reconcile() {
    const userId = getUserId()
    void queryClient.invalidateQueries({ queryKey: queryKeys.nfts.all(), refetchType: 'active' })
    if (userId) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.user.cart(userId), refetchType: 'active' })
      void queryClient.invalidateQueries({ queryKey: queryKeys.user.orders(userId), refetchType: 'active' })
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.user.scope(userId), 'quote'],
        refetchType: 'active',
      })
    }
  }

  return { handle, recordRestVersions, reconcile }
}
