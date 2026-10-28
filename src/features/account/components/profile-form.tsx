import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { type Profile, type UpdateProfileBody, updateProfileBodySchema } from '@/contracts'
import { applyApiErrors } from '@/shared/forms'
import { Button, TextField } from '@/shared/ui'

const FIELDS = ['displayName', 'username', 'email', 'ensName', 'walletNickname'] as const

const toValues = (profile: Profile): UpdateProfileBody => ({
  displayName: profile.displayName,
  username: profile.username,
  email: profile.email,
  ensName: profile.ensName,
  walletNickname: profile.walletNickname,
})

/** Dados do perfil (Figma: Perfil do colecionador). Campos opcionais vazios viram null. */
export function ProfileForm({
  profile,
  onSubmit,
}: {
  profile: Profile
  onSubmit: (values: UpdateProfileBody) => Promise<unknown>
}) {
  const [formError, setFormError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const { register, handleSubmit, setError, formState } = useForm<UpdateProfileBody>({
    resolver: zodResolver(updateProfileBodySchema),
    defaultValues: toValues(profile),
    mode: 'onBlur',
  })
  const errors = formState.errors
  const nullable = { setValueAs: (value: unknown) => (typeof value === 'string' && value.trim() === '' ? null : value) }
  const submit = handleSubmit(async (values) => {
    setFormError(null)
    setSaved(false)
    try {
      await onSubmit(values)
      setSaved(true)
    } catch (error) {
      setFormError(applyApiErrors(error, { setError, fields: FIELDS }))
    }
  })
  return (
    <form
      onSubmit={(event) => void submit(event)}
      noValidate
      aria-labelledby="profile-title"
      className="flex flex-col gap-5"
    >
      <h1 id="profile-title" className="text-body-lg font-bold text-foreground">
        Perfil do colecionador
      </h1>
      <div className="grid gap-5 md:grid-cols-2">
        <TextField
          label="Nome de exibição"
          required
          autoComplete="name"
          error={errors.displayName?.message}
          {...register('displayName')}
        />
        <TextField
          label="Nome de usuário"
          required
          autoComplete="username"
          error={errors.username?.message}
          {...register('username')}
        />
        <TextField
          label="E-mail"
          required
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <TextField
          label="Nome ENS"
          hint="Sem o sufixo .eth"
          error={errors.ensName?.message}
          endAdornment={<span className="text-label text-foreground-muted">.eth</span>}
          {...register('ensName', nullable)}
        />
        <TextField
          label="Apelido da carteira"
          error={errors.walletNickname?.message}
          {...register('walletNickname', nullable)}
        />
      </div>
      {formError && (
        <p role="alert" className="text-label text-danger-text">
          {formError}
        </p>
      )}
      <p role="status" className="text-label text-success">
        {saved ? 'Alterações salvas.' : ''}
      </p>
      <Button type="submit" className="self-start" isLoading={formState.isSubmitting} loadingText="Salvando…">
        Salvar
      </Button>
    </form>
  )
}
