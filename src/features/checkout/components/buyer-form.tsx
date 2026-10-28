import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { type Buyer, buyerSchema } from '@/contracts'
import { TextField } from '@/shared/ui'

export interface BuyerFormHandle {
  validate: () => Promise<Buyer | null>
}

export interface BuyerFormProps {
  defaults: Buyer
  /** Rascunho (sessionStorage) para retomar após expiração de sessão — sem dados sensíveis. */
  onDraftChange: (draft: Buyer) => void
  register: (handle: BuyerFormHandle) => void
}

const emptyToNull = {
  setValueAs: (value: unknown) => (typeof value === 'string' && value.trim() === '' ? null : value),
}

/** Perfil do colecionador no pagamento (Figma). A validação é disparada por “Revisar pedido”. */
export function BuyerForm({ defaults, onDraftChange, register: registerHandle }: BuyerFormProps) {
  const form = useForm<Buyer>({ resolver: zodResolver(buyerSchema), defaultValues: defaults, mode: 'onBlur' })
  const { register, control, formState } = form
  const errors = formState.errors
  const values = useWatch({ control })

  useEffect(() => {
    onDraftChange({ ...defaults, ...values })
  }, [values, defaults, onDraftChange])

  useEffect(() => {
    registerHandle({
      validate: async () => {
        const valid = await form.trigger(undefined, { shouldFocus: true })
        return valid ? buyerSchema.parse(form.getValues()) : null
      },
    })
  }, [form, registerHandle])

  return (
    <fieldset className="flex flex-col gap-5">
      <legend className="mb-5 text-body-lg font-bold text-foreground">Perfil do colecionador</legend>
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
          label="Código de indicação"
          hint="Opcional"
          error={errors.referralCode?.message}
          {...register('referralCode', emptyToNull)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="buyer-note" className="text-label font-bold text-foreground">
          Observação do colecionador (opcional)
        </label>
        <textarea
          id="buyer-note"
          rows={4}
          aria-invalid={errors.note ? true : undefined}
          aria-describedby={errors.note ? 'buyer-note-error' : undefined}
          className="rounded-sm border border-border-field bg-surface-raised p-3 text-label text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          {...register('note', emptyToNull)}
        />
        {errors.note && (
          <p id="buyer-note-error" className="text-caption text-danger-text">
            {errors.note.message}
          </p>
        )}
      </div>
    </fieldset>
  )
}
