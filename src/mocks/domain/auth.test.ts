// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { DEMO_PASSWORD } from '../fixtures/users'
import { authenticate, expireSession, login, register } from './auth'
import type { DomainError } from './context'
import { createTestDatabase } from './test-utils'

const attempt = <T>(promise: Promise<T>) =>
  promise.then(
    (value) => value,
    (error: unknown) => error as DomainError,
  )

describe('sessão simulada', () => {
  it('login com credenciais fictícias e senha armazenada só como hash', async () => {
    const { db } = await createTestDatabase()
    const auth = await db.transaction(({ db: state }) =>
      login(state, { email: 'ana@example.test', password: DEMO_PASSWORD }),
    )
    expect(auth.user.username).toBe('ana.collector')
    expect(db.read((state) => JSON.stringify(state.users))).not.toContain(DEMO_PASSWORD)
  })

  it('credenciais inválidas', async () => {
    const { db } = await createTestDatabase()
    const error = await attempt(
      db.transaction(({ db: state }) => login(state, { email: 'ana@example.test', password: 'errada' })),
    )
    expect(error).toMatchObject({ code: 'INVALID_CREDENTIALS' })
  })

  it('cadastro com e-mail existente gera conflito no campo', async () => {
    const { db } = await createTestDatabase()
    const error = await attempt(
      db.transaction(({ db: state }) =>
        register(state, {
          username: 'nova',
          email: 'taken@example.test',
          password: DEMO_PASSWORD,
          confirmPassword: DEMO_PASSWORD,
        }),
      ),
    )
    expect(error).toMatchObject({ code: 'EMAIL_TAKEN', extra: { fieldErrors: { email: [expect.any(String)] } } })
  })

  it('distingue sessão inexistente de sessão expirada', async () => {
    const { db } = await createTestDatabase()
    const { session } = await db.transaction(({ db: state }) =>
      login(state, { email: 'bruno@example.test', password: DEMO_PASSWORD }),
    )
    expect(db.read((state) => authenticate(state, session.token).user.id)).toBe('usr_bruno')

    await db.transaction(({ db: state }) => {
      expireSession(state, session.token)
    })
    expect(() => db.read((state) => authenticate(state, session.token))).toThrow(
      expect.objectContaining({ code: 'SESSION_EXPIRED' }),
    )
    expect(() => db.read((state) => authenticate(state, 'sess_desconhecida'))).toThrow(
      expect.objectContaining({ code: 'UNAUTHENTICATED' }),
    )
  })
})
