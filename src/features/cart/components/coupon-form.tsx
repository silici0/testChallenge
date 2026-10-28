import { type SyntheticEvent, useState } from 'react'

import { Button, TextField } from '@/shared/ui'

export interface CouponFormProps {
  appliedCode: string | null
  onApply: (code: string) => void
  onRemove: () => void
  isPending: boolean
  /** Erro do campo vindo da API (inválido, expirado, mínimo não atingido). */
  error: string | undefined
}

/** Cupom: aplica e remove, com erro associado ao campo. */
export function CouponForm({ appliedCode, onApply, onRemove, isPending, error }: CouponFormProps) {
  const [code, setCode] = useState('')
  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (code.trim()) onApply(code.trim().toUpperCase())
  }
  if (appliedCode) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-sm border border-success/60 bg-success/10 px-3 py-2">
        <p className="text-label text-foreground">
          Cupom <strong>{appliedCode}</strong> aplicado
        </p>
        <Button variant="link" size="sm" onClick={onRemove} isLoading={isPending} loadingText="Removendo…">
          Remover cupom
        </Button>
      </div>
    )
  }
  return (
    <form onSubmit={submit} className="flex items-end gap-0">
      <TextField
        label="Código promocional"
        placeholder="Digite o código promocional..."
        value={code}
        onChange={(event) => {
          setCode(event.target.value)
        }}
        error={error}
        autoCapitalize="characters"
        className="flex-1 [&_div]:rounded-r-none"
      />
      <Button
        type="submit"
        className="mt-[26px] h-11 self-start rounded-l-none"
        isLoading={isPending}
        loadingText="Aplicando…"
      >
        Aplicar
      </Button>
    </form>
  )
}
