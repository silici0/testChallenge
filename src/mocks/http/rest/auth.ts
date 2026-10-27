import { loginBodySchema, registerBodySchema } from '@/contracts'

import { authenticate, login, logout, register, toUserDto } from '../../domain/auth'
import { createRoute, type MockServices } from '../responder'

export function authRoutes(services: MockServices) {
  const { route, privateRoute } = createRoute(services)
  return [
    route('post', '/auth/register', async ({ json }) => {
      const body = registerBodySchema.parse(await json())
      return { status: 201, body: await services.db.transaction(({ db }) => register(db, body)) }
    }),
    route('post', '/auth/login', async ({ json }) => {
      const body = loginBodySchema.parse(await json())
      return services.db.transaction(({ db }) => login(db, body))
    }),
    privateRoute('get', '/auth/session', async ({ token }) =>
      services.db.transaction(({ db }) => {
        const { user, session } = authenticate(db, token)
        return { user: toUserDto(user), session: { token: session.token, expiresAt: session.expiresAt } }
      }),
    ),
    route('post', '/auth/logout', async ({ token }) => {
      await services.db.transaction(({ db }) => {
        logout(db, token)
      })
      return { status: 204 }
    }),
  ]
}
