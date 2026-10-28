import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'

import type { NftDetail, NftUpdatedEvent, Order, OrderUpdatedEvent } from '@/contracts'
import { nftListParamsSchema } from '@/contracts'
import { queryKeys } from '@/shared/query'
import { createEventGate } from '@/shared/realtime'

import { createRealtimeSync } from './realtime-sync'

const NFT = 'nft_a'

const nftUpdated = (eventId: string, version: number, priceEth = '2'): NftUpdatedEvent => ({
  eventId,
  type: 'nft.updated',
  resource: { type: 'nft', id: NFT },
  version,
  occurredAt: '2026-01-15T12:00:00.000Z',
  userId: null,
  data: {
    priceFromEth: priceEth,
    available: 3,
    editions: [{ id: 'ed_1', priceEth, available: 3, status: 'available' }],
  },
})

const orderUpdated = (userId: string, status: 'confirmed' | 'declined' = 'confirmed'): OrderUpdatedEvent => ({
  eventId: `evt_order_${userId}_${status}`,
  type: 'order.updated',
  resource: { type: 'order', id: 'ord_1' },
  version: 2,
  occurredAt: '2026-01-15T12:00:00.000Z',
  userId,
  data: { status, declineReason: status === 'declined' ? 'Saldo' : null, transaction: null },
})

function setup(userId: string | null = 'usr_ana') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const announce = vi.fn()
  const gate = createEventGate()
  const sync = createRealtimeSync({ queryClient, gate, getUserId: () => userId, announce })
  const detail = {
    id: NFT,
    name: 'Emerald Ape #042',
    version: 1,
    priceFromEth: '1',
    available: 5,
    editions: [{ id: 'ed_1', priceEth: '1', available: 5, status: 'available' }],
  }
  queryClient.setQueryData(queryKeys.nfts.detail(NFT), detail)
  const listKey = queryKeys.nfts.list(nftListParamsSchema.parse({}))
  queryClient.setQueryData(listKey, { items: [{ id: NFT, version: 1, priceFromEth: '1', available: 5 }], total: 1 })
  return { queryClient, announce, gate, sync, listKey }
}

describe('createRealtimeSync', () => {
  it('nft.updated atualiza detalhe e listas em cache com a nova versão', () => {
    const { queryClient, sync, listKey } = setup()
    sync.handle(nftUpdated('evt_1', 2, '2.5'))
    expect(queryClient.getQueryData<NftDetail>(queryKeys.nfts.detail(NFT))).toMatchObject({
      version: 2,
      priceFromEth: '2.5',
      available: 3,
    })
    expect(queryClient.getQueryData<{ items: { priceFromEth: string }[] }>(listKey)?.items[0]?.priceFromEth).toBe('2.5')
  })

  it('evento antigo ou duplicado não regride nem reaplica efeitos', () => {
    const { queryClient, sync, announce } = setup()
    queryClient.setQueryData(queryKeys.user.cart('usr_ana'), {
      items: [{ nftId: NFT, nft: { name: 'Emerald Ape #042' } }],
    })
    sync.handle(nftUpdated('evt_2', 3, '3'))
    sync.handle(nftUpdated('evt_2', 3, '3'))
    sync.handle(nftUpdated('evt_old', 2, '0.1'))
    expect(queryClient.getQueryData<NftDetail>(queryKeys.nfts.detail(NFT))?.priceFromEth).toBe('3')
    expect(announce).toHaveBeenCalledOnce()
  })

  it('NFT no carrinho: invalida carrinho e cotação e anuncia a alteração', () => {
    const { queryClient, sync, announce } = setup()
    queryClient.setQueryData(queryKeys.user.cart('usr_ana'), {
      items: [{ nftId: NFT, nft: { name: 'Emerald Ape #042' } }],
    })
    queryClient.setQueryData(queryKeys.user.quote('usr_ana', 'ethereum'), { id: 'qt_1' })
    sync.handle(nftUpdated('evt_3', 2))
    expect(queryClient.getQueryState(queryKeys.user.cart('usr_ana'))?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(queryKeys.user.quote('usr_ana', 'ethereum'))?.isInvalidated).toBe(true)
    expect(announce).toHaveBeenCalledWith(expect.stringContaining('Emerald Ape #042'), 'polite')
  })

  it('carrinho de visitante também é atualizado e anunciado', () => {
    const { queryClient, sync, announce } = setup(null)
    const guestKey = queryKeys.guestCart('guest_1')
    queryClient.setQueryData(guestKey, { items: [{ nftId: NFT, nft: { name: 'Emerald Ape #042' } }] })
    sync.handle(nftUpdated('evt_guest', 2))
    expect(queryClient.getQueryState(guestKey)?.isInvalidated).toBe(true)
    expect(announce).toHaveBeenCalledWith(expect.stringContaining('Emerald Ape #042'), 'polite')
  })

  it('versão vinda do REST bloqueia evento mais antigo', () => {
    const { queryClient, sync } = setup()
    sync.recordRestVersions()
    queryClient.setQueryData(queryKeys.nfts.detail(NFT), {
      id: NFT,
      version: 7,
      priceFromEth: '9',
      available: 1,
      editions: [],
    })
    sync.handle(nftUpdated('evt_4', 6, '0.5'))
    expect(queryClient.getQueryData<NftDetail>(queryKeys.nfts.detail(NFT))?.priceFromEth).toBe('9')
  })

  it('order.updated de outro usuário é ignorado; do próprio atualiza o pedido e o carrinho', () => {
    const { queryClient, sync } = setup('usr_ana')
    const orderKey = queryKeys.user.order('usr_ana', 'ord_1')
    queryClient.setQueryData(orderKey, { id: 'ord_1', status: 'pending', version: 1 })
    queryClient.setQueryData(queryKeys.user.cart('usr_ana'), { items: [] })

    sync.handle(orderUpdated('usr_bruno'))
    expect(queryClient.getQueryData<Order>(orderKey)?.status).toBe('pending')

    sync.handle(orderUpdated('usr_ana'))
    expect(queryClient.getQueryData<Order>(orderKey)).toMatchObject({ status: 'confirmed', version: 2 })
    expect(queryClient.getQueryState(queryKeys.user.cart('usr_ana'))?.isInvalidated).toBe(true)
  })

  it('reconexão reconcilia os recursos ativos com a API', () => {
    const { queryClient, sync } = setup()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    sync.reconcile()
    expect(invalidate).toHaveBeenCalled()
  })
})
