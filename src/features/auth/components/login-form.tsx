import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { emailSchema } from '@/contracts'
import { applyApiErrors } from '@/shared/forms'
import { Button, PasswordField, TextField, UnavailableAction } from '@/shared/ui'

const loginFormSchema = z.object({ email: emailSchema, password: z.string().min(1, 'Informe a senha') })
export type LoginFormValues = z.infer<typeof loginFormSchema>

export interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => Promise<unknown>
}

/** Login com validação local (Zod) e erros da API associados aos campos. */
export function LoginForm({ onSubmit }: LoginFormProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const { register, handleSubmit, setError, formState } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    mode: 'onBlur',
  })
  const submit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await onSubmit(values)
    } catch (error) {
      setFormError(applyApiErrors(error, { setError, fields: ['email', 'password'] }))
    }
  })
  return (
    <form onSubmit={(event) => void submit(event)} noValidate className="flex flex-col gap-4">
      <TextField
        label="E-mail"
        hideLabel
        type="email"
        autoComplete="email"
        placeholder="contato@email.com"
        error={formState.errors.email?.message}
        {...register('email')}
      />
      <PasswordField
        label="Senha"
        hideLabel
        autoComplete="current-password"
        placeholder="Senha"
        error={formState.errors.password?.message}
        {...register('password')}
      />
      <UnavailableAction appearance="text" className="self-end text-primary">
        Esqueceu a senha?
      </UnavailableAction>
      {formError && (
        <p role="alert" className="text-label text-danger-text">
          {formError}
        </p>
      )}
      <Button type="submit" size="lg" fullWidth isLoading={formState.isSubmitting} loadingText="Entrando…">
        Entrar
      </Button>
    </form>
  )
}
