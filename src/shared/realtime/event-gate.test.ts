import { describe, expect, it } from 'vitest'

import type { NftUpdatedEvent, RealtimeEvent } from '@/contracts'

import { createEventGate } from './event-gate'

const nftEvent = (eventId: string, version: number): NftUpdatedEvent => ({
  eventId,
  type: 'nft.updated',
  resource: { type: 'nft', id: 'nft_a' },
  version,
  occurredAt: '2026-01-15T12:00:00.000Z',
  userId: null,
  data: { priceFromEth: '1', available: 1, editions: [] },
})

const orderEvent = (eventId: string, userId: string, version = 2): RealtimeEvent => ({
  eventId,
  type: 'order.updated',
  resource: { type: 'order', id: 'ord_1' },
  version,
  occurredAt: '2026-01-15T12:00:00.000Z',
  userId,
  data: { status: 'confirmed', declineReason: null, transaction: null },
})

describe('createEventGate', () => {
  it('aceita um evento novo e rejeita a duplicata com o mesmo eventId', () => {
    const gate = createEventGate()
    expect(gate.accept(nftEvent('evt_1', 2), null)).toBe(true)
    expect(gate.accept(nftEvent('evt_1', 2), null)).toBe(false)
  })

  it('rejeita versão antiga ou igual à já conhecida (sem regredir estado)', () => {
    const gate = createEventGate()
    expect(gate.accept(nftEvent('evt_2', 3), null)).toBe(true)
    expect(gate.accept(nftEvent('evt_3', 2), null)).toBe(false)
    expect(gate.accept(nftEvent('evt_4', 3), null)).toBe(false)
    expect(gate.accept(nftEvent('evt_5', 4), null)).toBe(true)
  })

  it('versões vindas do REST também bloqueiam eventos mais antigos', () => {
    const gate = createEventGate()
    gate.recordVersion('nft:nft_a', 5)
    expect(gate.accept(nftEvent('evt_6', 4), null)).toBe(false)
    gate.recordVersion('nft:nft_a', 3) // nunca regride
    expect(gate.versionOf('nft:nft_a')).toBe(5)
  })

  it('descarta eventos privados de outro usuário ou sem sessão', () => {
    const gate = createEventGate()
    expect(gate.accept(orderEvent('evt_7', 'usr_ana'), 'usr_bruno')).toBe(false)
    expect(gate.accept(orderEvent('evt_8', 'usr_ana'), null)).toBe(false)
    expect(gate.accept(orderEvent('evt_9', 'usr_ana'), 'usr_ana')).toBe(true)
  })

  it('limita a memória de eventIds (LRU)', () => {
    const gate = createEventGate({ maxRemembered: 2 })
    gate.accept(nftEvent('evt_a', 10), null)
    gate.accept({ ...nftEvent('evt_b', 11), resource: { type: 'nft', id: 'nft_b' } }, null)
    gate.accept({ ...nftEvent('evt_c', 12), resource: { type: 'nft', id: 'nft_c' } }, null)
    expect(gate.rememberedCount()).toBe(2)
  })

  it('reset (logout/troca de usuário) esquece estado privado', () => {
    const gate = createEventGate()
    gate.accept(orderEvent('evt_10', 'usr_ana', 3), 'usr_ana')
    gate.reset()
    expect(gate.versionOf('order:ord_1')).toBeUndefined()
  })
})
