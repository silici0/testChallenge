import { describe, expect, it } from 'vitest'

import { isSafeRedirect, requireAuth } from './guards'

describe('guards', () => {
  it('aceita apenas caminhos internos', () => {
    expect(isSafeRedirect('/checkout?step=wallet')).toBe(true)
    expect(isSafeRedirect('//evil.com')).toBe(false)
    expect(isSafeRedirect('https://evil.com')).toBe(false)
    expect(isSafeRedirect(undefined)).toBe(false)
  })

  it('visitante em rota privada é redirecionado ao login com retorno', () => {
    let thrown: unknown
    try {
      requireAuth({ context: { user: null }, location: { href: '/checkout' } })
    } catch (error) {
      thrown = error
    }
    expect(thrown).toMatchObject({ options: { to: '/login', search: { redirect: '/checkout' } } })
  })

  it('usuário autenticado segue', () => {
    const user = { id: 'usr_ana', displayName: 'Ana', username: 'ana', email: 'a@example.test', avatarUrl: null }
    expect(requireAuth({ context: { user }, location: { href: '/checkout' } })).toEqual({ user })
  })
})
