import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createSessionStore } from './session-store'

describe('sessionStore', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('recupera o token após refresh (nova instância lê o storage)', () => {
    createSessionStore().signIn('sess_1', 'usr_ana')
    expect(createSessionStore().getSnapshot().token).toBe('sess_1')
  })

  it('mantém o mesmo carrinho de visitante entre recargas e troca quando pedido', () => {
    const store = createSessionStore()
    const first = store.getSnapshot().guestCartId
    expect(createSessionStore().getSnapshot().guestCartId).toBe(first)
    store.rotateGuestCart()
    expect(store.getSnapshot().guestCartId).not.toBe(first)
  })

  it('notifica assinantes e limpa o token no signOut', () => {
    const store = createSessionStore()
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)
    store.signIn('sess_1', 'usr_ana')
    store.setUser('usr_ana')
    store.signOut()
    unsubscribe()
    store.signIn('sess_2', 'usr_bruno')
    expect(listener).toHaveBeenCalledTimes(3)
    expect(localStorage.getItem('auth:token')).toBe('sess_2')
  })
})
