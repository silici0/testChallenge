import type { AuthResponse, LoginBody, RegisterBody, User } from '@/contracts'

import { isoIn, isoNow, nextId } from '../db/runtime'
import type { DbState, SessionRecord, UserRecord } from '../db/schema'
import { mergeGuestCart } from './cart'
import { fail } from './context'
import { createSalt, hashPassword, verifyPassword } from './password'

export const SESSION_TTL_MS = 30 * 60_000

export const toUserDto = (user: UserRecord): User => ({
  id: user.id,
  displayName: user.displayName,
  username: user.username,
  email: user.email,
  avatarUrl: user.avatarUrl,
})

const randomToken = () => `sess_${crypto.randomUUID()}`

function openSession(db: DbState, user: UserRecord): AuthResponse {
  const session: SessionRecord = { token: randomToken(), userId: user.id, expiresAt: isoIn(SESSION_TTL_MS) }
  db.sessions.push(session)
  return { user: toUserDto(user), session: { token: session.token, expiresAt: session.expiresAt } }
}

export function assertUniqueIdentity(
  db: DbState,
  identity: { email: string; username: string },
  exceptUserId?: string,
) {
  const others = db.users.filter((user) => user.id !== exceptUserId)
  if (others.some((user) => user.email.toLowerCase() === identity.email.toLowerCase())) {
    fail('EMAIL_TAKEN', 'E-mail já cadastrado', { fieldErrors: { email: ['Este e-mail já está cadastrado'] } })
  }
  if (others.some((user) => user.username === identity.username)) {
    fail('USERNAME_TAKEN', 'Nome de usuário em uso', {
      fieldErrors: { username: ['Este nome de usuário já está em uso'] },
    })
  }
}

export async function register(db: DbState, body: RegisterBody): Promise<AuthResponse> {
  assertUniqueIdentity(db, body)
  const salt = createSalt()
  const user: UserRecord = {
    id: nextId(db, 'usr'),
    displayName: body.username,
    username: body.username,
    email: body.email.toLowerCase(),
    passwordSalt: salt,
    passwordHash: await hashPassword(body.password, salt),
    ensName: null,
    walletNickname: null,
    avatarUrl: null,
    version: 1,
  }
  db.users.push(user)
  if (body.guestCartId) mergeGuestCart(db, body.guestCartId, user.id)
  return openSession(db, user)
}

export async function login(db: DbState, body: LoginBody): Promise<AuthResponse> {
  const user = db.users.find((candidate) => candidate.email === body.email.toLowerCase())
  const valid = user ? await verifyPassword(body.password, user.passwordSalt, user.passwordHash) : false
  if (!user || !valid) {
    return fail('INVALID_CREDENTIALS', 'E-mail ou senha incorretos', {
      fieldErrors: { password: ['E-mail ou senha incorretos'] },
    })
  }
  if (body.guestCartId) mergeGuestCart(db, body.guestCartId, user.id)
  return openSession(db, user)
}

/** Resolve o token: inexistente → UNAUTHENTICATED; vencido → SESSION_EXPIRED; válido → renova (sliding). */
export function authenticate(db: DbState, token: string | null): { user: UserRecord; session: SessionRecord } {
  const session = token ? db.sessions.find((candidate) => candidate.token === token) : undefined
  if (!session) return fail('UNAUTHENTICATED', token ? 'Sessão inválida' : 'Autenticação necessária')
  if (session.expiresAt <= isoNow()) fail('SESSION_EXPIRED', 'Sessão expirada')
  const user = db.users.find((candidate) => candidate.id === session.userId)
  if (!user) return fail('UNAUTHENTICATED', 'Sessão inválida')
  session.expiresAt = isoIn(SESSION_TTL_MS)
  return { user, session }
}

export function expireSession(db: DbState, token: string): void {
  const session = db.sessions.find((candidate) => candidate.token === token)
  if (session) session.expiresAt = new Date(0).toISOString()
}

export function logout(db: DbState, token: string | null): void {
  db.sessions = db.sessions.filter((session) => session.token !== token)
}
