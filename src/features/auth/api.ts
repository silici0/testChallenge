import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { type AuthResponse, authResponseSchema, type LoginBody, type RegisterBody, type User } from '@/contracts'
import { httpClient, isApiError } from '@/shared/api'
import { queryKeys } from '@/shared/query'

import { sessionStore } from './session-store'

/** Sessão atual: sem token não há requisição; token inválido/expirado vira visitante. */
export const sessionQuery = () =>
  queryOptions({
    queryKey: queryKeys.session(),
    queryFn: async ({ signal }): Promise<User | null> => {
      if (!sessionStore.getSnapshot().token) return null
      try {
        const { user } = await httpClient().request({
          method: 'GET',
          url: '/auth/session',
          schema: authResponseSchema,
          signal,
        })
        sessionStore.setUser(user.id)
        return user
      } catch (error) {
        if (isApiError(error) && error.is('UNAUTHENTICATED', 'SESSION_EXPIRED')) {
          sessionStore.signOut()
          return null
        }
        throw error
      }
    },
    staleTime: Infinity,
  })

const withGuestCart = <T extends object>(body: T) => ({ ...body, guestCartId: sessionStore.getSnapshot().guestCartId })

export const authApi = {
  login: (body: Omit<LoginBody, 'guestCartId'>): Promise<AuthResponse> =>
    httpClient().request({ method: 'POST', url: '/auth/login', data: withGuestCart(body), schema: authResponseSchema }),
  register: (body: Omit<RegisterBody, 'guestCartId'>): Promise<AuthResponse> =>
    httpClient().request({
      method: 'POST',
      url: '/auth/register',
      data: withGuestCart(body),
      schema: authResponseSchema,
    }),
  logout: (): Promise<unknown> => httpClient().request({ method: 'POST', url: '/auth/logout', schema: z.unknown() }),
}
