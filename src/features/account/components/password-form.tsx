import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { type ChangePasswordBody, changePasswordBodySchema } from '@/contracts'
import { applyApiErrors } from '@/shared/forms'
import { Button, PasswordField } from '@/shared/ui'

const FIELDS = ['currentPassword', 'newPassword', 'confirmPassword'] as const

/** Alteração de senha: formulário próprio (não mistura com os dados do perfil). */
export function PasswordForm({ onSubmit }: { onSubmit: (values: ChangePasswordBody) => Promise<unknown> }) {
  const [formError, setFormError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const { register, handleSubmit, setError, reset, formState } = useForm<ChangePasswordBody>({
    resolver: zodResolver(changePasswordBodySchema),
    mode: 'onBlur',
  })
  const errors = formState.errors
  const submit = handleSubmit(async (values) => {
    setFormError(null)
    setDone(false)
    try {
      await onSubmit(values)
      reset()
      setDone(true)
    } catch (error) {
      setFormError(applyApiErrors(error, { setError, fields: FIELDS }))
    }
  })
  return (
    <form
      onSubmit={(event) => void submit(event)}
      noValidate
      aria-labelledby="password-title"
      className="flex max-w-md flex-col gap-5"
    >
      <h2 id="password-title" className="text-body-lg font-bold text-foreground">
        Alterar senha
      </h2>
      <PasswordField
        label="Senha atual"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register('currentPassword')}
      />
      <PasswordField
        label="Nova senha"
        autoComplete="new-password"
        hint="Mínimo de 8 caracteres, com maiúscula, minúscula, número e símbolo."
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
      <PasswordField
        label="Confirmar nova senha"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      {formError && (
        <p role="alert" className="text-label text-danger-text">
          {formError}
        </p>
      )}
      <p role="status" className="text-label text-success">
        {done ? 'Senha alterada.' : ''}
      </p>
      <Button type="submit" className="self-start" isLoading={formState.isSubmitting} loadingText="Alterando…">
        Alterar senha
      </Button>
    </form>
  )
}
