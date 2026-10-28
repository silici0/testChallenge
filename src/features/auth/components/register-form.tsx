import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

import { registerBodySchema } from '@/contracts'
import { applyApiErrors } from '@/shared/forms'
import { Button, PasswordField, TextField } from '@/shared/ui'

const registerFormSchema = registerBodySchema
export type RegisterFormValues = z.infer<typeof registerFormSchema>

const FIELDS = ['username', 'email', 'password', 'confirmPassword'] as const

/** Cadastro: mesmas regras da API (contrato compartilhado) e conflito de e-mail/usuário no campo. */
export function RegisterForm({ onSubmit }: { onSubmit: (values: RegisterFormValues) => Promise<unknown> }) {
  const [formError, setFormError] = useState<string | null>(null)
  const { register, handleSubmit, setError, formState } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    mode: 'onBlur',
  })
  const errors = formState.errors
  const submit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await onSubmit(values)
    } catch (error) {
      setFormError(applyApiErrors(error, { setError, fields: FIELDS }))
    }
  })
  return (
    <form onSubmit={(event) => void submit(event)} noValidate className="flex flex-col gap-4">
      <TextField
        label="Nome de usuário"
        hideLabel
        autoComplete="username"
        placeholder="Nome de usuário"
        error={errors.username?.message}
        {...register('username')}
      />
      <TextField
        label="E-mail"
        hideLabel
        type="email"
        autoComplete="email"
        placeholder="Digite seu e-mail"
        error={errors.email?.message}
        {...register('email')}
      />
      <PasswordField
        label="Senha"
        hideLabel
        autoComplete="new-password"
        placeholder="Senha"
        hint="Mínimo de 8 caracteres, com maiúscula, minúscula, número e símbolo."
        error={errors.password?.message}
        {...register('password')}
      />
      <PasswordField
        label="Confirmar senha"
        hideLabel
        autoComplete="new-password"
        placeholder="Confirmar senha"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      {formError && (
        <p role="alert" className="text-label text-danger-text">
          {formError}
        </p>
      )}
      <Button type="submit" size="lg" fullWidth isLoading={formState.isSubmitting} loadingText="Criando conta…">
        Criar conta
      </Button>
    </form>
  )
}
