import { QueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuthResponse } from '@/contracts'
import { createSessionStore } from '@/features/auth/session-store'
import { queryKeys } from '@/shared/query'
import { createEventGate } from '@/shared/realtime'

import { createSessionManager } from './session-manager'

const auth = (userId: string, token = `sess_${userId}`): AuthResponse => ({
  user: { id: userId, displayName: userId, username: userId, email: `${userId}@example.test`, avatarUrl: null },
  session: { token, expiresAt: '2099-01-01T00:00:00.000Z' },
})

function setup() {
  const queryClient = new QueryClient()
  const store = createSessionStore()
  const realtime = { reconnect: vi.fn(() => Promise.resolve()), disconnect: vi.fn() }
  const gate = createEventGate()
  const onExpired = vi.fn()
  const announce = vi.fn()
  const logoutRequest = vi.fn(() => Promise.resolve())
  const manager = createSessionManager({ queryClient, store, realtime, gate, onExpired, announce, logoutRequest })
  return { queryClient, store, realtime, gate, onExpired, announce, logoutRequest, manager }
}

describe('createSessionManager', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('login: guarda o token, publica o usuário, descarta o carrinho de visitante e reconecta o socket', async () => {
    const { manager, store, queryClient, realtime } = setup()
    const guestKey = queryKeys.guestCart(store.getSnapshot().guestCartId)
    queryClient.setQueryData(guestKey, { items: [] })

    await manager.signedIn(auth('usr_ana'))

    expect(store.getSnapshot()).toMatchObject({ token: 'sess_usr_ana', userId: 'usr_ana' })
    expect(localStorage.getItem('auth:token')).toBe('sess_usr_ana')
    expect(queryClient.getQueryData(queryKeys.session())).toMatchObject({ id: 'usr_ana' })
    expect(queryClient.getQueryData(guestKey)).toBeUndefined()
    expect(realtime.reconnect).toHaveBeenCalledOnce()
  })

  it('logout: remove todos os dados privados, esquece eventos e volta a visitante', async () => {
    const { manager, store, queryClient, gate, logoutRequest } = setup()
    await manager.signedIn(auth('usr_ana'))
    queryClient.setQueryData(queryKeys.user.cart('usr_ana'), { items: [1] })
    gate.recordVersion('order:ord_1', 3)

    await manager.logout()

    expect(logoutRequest).toHaveBeenCalledOnce()
    expect(queryClient.getQueryData(queryKeys.user.cart('usr_ana'))).toBeUndefined()
    expect(queryClient.getQueryData(queryKeys.session())).toBeNull()
    expect(gate.versionOf('order:ord_1')).toBeUndefined()
    expect(store.getSnapshot().token).toBeNull()
  })

  it('logout limpa localmente mesmo se a API falhar', async () => {
    const { manager, store, logoutRequest } = setup()
    await manager.signedIn(auth('usr_ana'))
    logoutRequest.mockRejectedValueOnce(new Error('offline'))
    await manager.logout()
    expect(store.getSnapshot().token).toBeNull()
  })

  it('troca de usuário sem logout não deixa dados do anterior', async () => {
    const { manager, queryClient } = setup()
    await manager.signedIn(auth('usr_ana'))
    queryClient.setQueryData(queryKeys.user.favorites('usr_ana'), { nftIds: ['x'] })
    await manager.signedIn(auth('usr_bruno'))
    expect(queryClient.getQueryData(queryKeys.user.favorites('usr_ana'))).toBeUndefined()
  })

  it('expiração: uma única notificação por token, com aviso e redirecionamento', async () => {
    const { manager, onExpired, announce, store } = setup()
    await manager.signedIn(auth('usr_ana'))
    manager.expire()
    manager.expire()
    expect(onExpired).toHaveBeenCalledOnce()
    expect(announce).toHaveBeenCalledWith(expect.stringMatching(/sessão expirou/i), 'assertive')
    expect(store.getSnapshot().token).toBeNull()
  })

  it('lembra da expiração até o próximo login ou logout (o guard informa o motivo)', async () => {
    const { manager } = setup()
    await manager.signedIn(auth('usr_ana'))
    expect(manager.hasExpired()).toBe(false)
    manager.expire()
    expect(manager.hasExpired()).toBe(true)
    await manager.signedIn(auth('usr_ana'))
    expect(manager.hasExpired()).toBe(false)
    manager.expire()
    await manager.logout()
    expect(manager.hasExpired()).toBe(false)
  })
})
