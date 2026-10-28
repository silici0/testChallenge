import { zodResolver } from '@hookform/resolvers/zod'
import { useId, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'

import { type Wallet, type WalletInput, walletInputSchema } from '@/contracts'
import { applyApiErrors } from '@/shared/forms'
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, TextField } from '@/shared/ui'

import { NETWORK_LABELS, PROVIDER_LABELS } from './labels'

const FIELDS = ['displayName', 'nickname', 'network', 'address', 'provider', 'ensName'] as const

export interface WalletFormProps {
  walletRole: Wallet['role']
  initial: Partial<WalletInput> | undefined
  onSubmit: (values: WalletInput) => Promise<unknown>
  submitLabel?: string
}

const emptyToNull = {
  setValueAs: (value: unknown) => (typeof value === 'string' && value.trim() === '' ? null : value),
}

/** Cadastro/edição de carteira; ENS só para Ethereum (comentário #18) e endereço validado por rede. */
export function WalletForm({ walletRole, initial, onSubmit, submitLabel = 'Salvar carteira' }: WalletFormProps) {
  const id = useId()
  const [formError, setFormError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const { register, control, handleSubmit, setError, formState } = useForm<WalletInput>({
    resolver: zodResolver(walletInputSchema),
    defaultValues: { role: walletRole, displayName: '', nickname: null, address: '', ensName: null, ...initial },
    mode: 'onBlur',
  })
  const errors = formState.errors
  const network = useWatch({ control, name: 'network' })
  const submit = handleSubmit(async (values) => {
    setFormError(null)
    setSaved(false)
    try {
      await onSubmit({ ...values, ensName: values.network === 'ethereum' ? values.ensName : null })
      setSaved(true)
    } catch (error) {
      setFormError(applyApiErrors(error, { setError, fields: FIELDS }))
    }
  })

  const selectField = ({
    name,
    label,
    options,
    placeholder,
  }: {
    name: 'network' | 'provider'
    label: string
    options: Record<string, string>
    placeholder: string
  }) => (
    <div className="flex flex-col gap-1.5">
      <span id={`${id}-${name}`} className="text-label font-bold text-foreground">
        {label}
        <span aria-hidden="true" className="ml-1 text-primary">
          *
        </span>
      </span>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger
              aria-labelledby={`${id}-${name}`}
              aria-invalid={errors[name] ? true : undefined}
              aria-describedby={errors[name] ? `${id}-${name}-error` : undefined}
              className="h-11 w-full bg-surface-raised"
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(options).map(([value, text]) => (
                <SelectItem key={value} value={value}>
                  {text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {errors[name] && (
        <p id={`${id}-${name}-error`} className="text-caption text-danger-text">
          {errors[name].message ?? `Selecione ${label.toLowerCase()}`}
        </p>
      )}
    </div>
  )

  return (
    <form onSubmit={(event) => void submit(event)} noValidate className="flex flex-col gap-5">
      <div className="grid gap-5 md:grid-cols-2">
        <TextField label="Nome de exibição" required error={errors.displayName?.message} {...register('displayName')} />
        <TextField
          label="Apelido da carteira"
          error={errors.nickname?.message}
          {...register('nickname', emptyToNull)}
        />
        {selectField({ name: 'network', label: 'Rede', options: NETWORK_LABELS, placeholder: 'Selecione uma rede' })}
        {selectField({
          name: 'provider',
          label: 'Tipo de carteira',
          options: PROVIDER_LABELS,
          placeholder: 'Selecione uma carteira',
        })}
        <TextField
          label="Endereço da carteira"
          required
          placeholder={network === 'solana' ? 'Endereço Solana (base58)' : 'Endereço 0x da carteira'}
          autoComplete="off"
          spellCheck={false}
          error={errors.address?.message}
          className="md:col-span-2"
          {...register('address')}
        />
        {network === 'ethereum' && (
          <TextField
            label="Nome ENS"
            hint="Opcional, sem o sufixo .eth"
            error={errors.ensName?.message}
            endAdornment={<span className="text-label text-foreground-muted">.eth</span>}
            {...register('ensName', emptyToNull)}
          />
        )}
      </div>
      {formError && (
        <p role="alert" className="text-label text-danger-text">
          {formError}
        </p>
      )}
      <p role="status" className="text-label text-success">
        {saved ? 'Carteira salva.' : ''}
      </p>
      <Button type="submit" className="self-start" isLoading={formState.isSubmitting} loadingText="Salvando…">
        {submitLabel}
      </Button>
    </form>
  )
}
