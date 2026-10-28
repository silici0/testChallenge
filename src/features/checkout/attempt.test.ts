import { beforeEach, describe, expect, it } from 'vitest'

import type { CreateOrderBody } from '@/contracts'

import { clearAttempt, loadAttempt, prepareAttempt, recordOrder } from './attempt'

const body: CreateOrderBody = {
  quoteId: 'qt_1',
  walletId: 'wal_1',
  network: 'ethereum',
  buyer: { displayName: 'Ana', username: 'ana', email: 'ana@example.test', referralCode: null, note: null },
}

describe('tentativa de compra (idempotência no cliente)', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('cria a chave antes do envio e a persiste (sobrevive a refresh)', () => {
    const attempt = prepareAttempt(body)
    expect(attempt.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/)
    expect(loadAttempt()).toEqual(attempt)
  })

  it('reenvio do mesmo corpo reutiliza a mesma chave (timeout, clique repetido, refresh)', () => {
    const first = prepareAttempt(body)
    const retry = prepareAttempt({ ...body, buyer: { ...body.buyer } })
    expect(retry.idempotencyKey).toBe(first.idempotencyKey)
  })

  it('nova cotação ou outro corpo gera outra chave', () => {
    const first = prepareAttempt(body)
    expect(prepareAttempt({ ...body, quoteId: 'qt_2' }).idempotencyKey).not.toBe(first.idempotencyKey)
  })

  it('registra o pedido criado e limpa ao final', () => {
    prepareAttempt(body)
    recordOrder('ord_1')
    expect(loadAttempt()?.orderId).toBe('ord_1')
    clearAttempt()
    expect(loadAttempt()).toBeNull()
  })

  it('ignora conteúdo corrompido no storage', () => {
    sessionStorage.setItem('checkout:attempt', '{"x":1}')
    expect(loadAttempt()).toBeNull()
  })
})
