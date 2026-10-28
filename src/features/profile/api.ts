import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { type ChangePasswordBody, profileSchema, type UpdateProfileBody } from '@/contracts'
import { httpClient } from '@/shared/api'
import { queryKeys } from '@/shared/query'

export const profileQuery = (userId: string) =>
  queryOptions({
    queryKey: queryKeys.user.profile(userId),
    queryFn: ({ signal }) => httpClient().request({ method: 'GET', url: '/me/profile', schema: profileSchema, signal }),
    staleTime: 5 * 60_000,
  })

export const profileApi = {
  update: (body: UpdateProfileBody) =>
    httpClient().request({ method: 'PATCH', url: '/me/profile', data: body, schema: profileSchema }),
  uploadAvatar: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return httpClient().request({ method: 'PUT', url: '/me/avatar', data: form, schema: profileSchema })
  },
  removeAvatar: () => httpClient().request({ method: 'DELETE', url: '/me/avatar', schema: profileSchema }),
  changePassword: (body: ChangePasswordBody) =>
    httpClient().request({ method: 'POST', url: '/me/password', data: body, schema: z.unknown() }),
}
