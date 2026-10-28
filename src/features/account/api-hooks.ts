import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { Profile, User } from '@/contracts'
import { profileApi } from '@/features/profile/api'
import { announce } from '@/shared/a11y'
import { queryKeys } from '@/shared/query'

/** Mutations do perfil: atualizam o cache do perfil e o usuário da sessão (nome/avatar no header). */
export function useProfileMutations(userId: string) {
  const queryClient = useQueryClient()
  const onProfile = (profile: Profile, message: string) => {
    queryClient.setQueryData(queryKeys.user.profile(userId), profile)
    queryClient.setQueryData<User | null>(queryKeys.session(), (user) =>
      user
        ? {
            ...user,
            displayName: profile.displayName,
            username: profile.username,
            email: profile.email,
            avatarUrl: profile.avatarUrl,
          }
        : user,
    )
    announce(message, 'polite')
  }
  return {
    update: useMutation({
      mutationFn: profileApi.update,
      onSuccess: (profile) => onProfile(profile, 'Perfil atualizado.'),
    }),
    uploadAvatar: useMutation({
      mutationFn: profileApi.uploadAvatar,
      onSuccess: (profile) => onProfile(profile, 'Avatar atualizado.'),
    }),
    removeAvatar: useMutation({
      mutationFn: profileApi.removeAvatar,
      onSuccess: (profile) => onProfile(profile, 'Avatar removido.'),
    }),
    changePassword: useMutation({
      mutationFn: profileApi.changePassword,
      onSuccess: () => announce('Senha alterada.', 'polite'),
    }),
  }
}
