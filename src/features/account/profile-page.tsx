import { useQuery } from '@tanstack/react-query'
import { useRouteContext } from '@tanstack/react-router'

import { profileQuery } from '@/features/profile/api'
import { ErrorState, Skeleton, SkeletonRegion } from '@/shared/ui'

import { useProfileMutations } from './api-hooks'
import { AvatarField } from './components/avatar-field'
import { PasswordForm } from './components/password-form'
import { ProfileForm } from './components/profile-form'

export function ProfilePage() {
  const { user } = useRouteContext({ from: '/account' })
  const profile = useQuery(profileQuery(user.id))
  const mutations = useProfileMutations(user.id)

  if (profile.isError && !profile.data)
    return <ErrorState title="Não foi possível carregar o perfil" onRetry={() => void profile.refetch()} />
  if (!profile.data) {
    return (
      <SkeletonRegion label="Carregando perfil" className="grid gap-5 md:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-[70px] w-full" />
        ))}
      </SkeletonRegion>
    )
  }
  return (
    <div className="flex flex-col gap-10">
      <ProfileForm profile={profile.data} onSubmit={(values) => mutations.update.mutateAsync(values)} />
      <AvatarField
        avatarUrl={profile.data.avatarUrl}
        onUpload={(file) => mutations.uploadAvatar.mutateAsync(file)}
        onRemove={() => mutations.removeAvatar.mutateAsync()}
        isPending={mutations.uploadAvatar.isPending}
      />
      <PasswordForm onSubmit={(values) => mutations.changePassword.mutateAsync(values)} />
    </div>
  )
}
