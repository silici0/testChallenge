import { type ComponentProps, type ReactNode, useId } from 'react'

import { cn } from '@/shared/lib/cn'

export interface TextFieldProps extends Omit<ComponentProps<'input'>, 'id'> {
  label: string
  /** Texto de ajuda exibido abaixo do campo. */
  hint?: string
  /** Mensagem de erro (validação local ou fieldErrors da API). */
  error?: string | undefined
  /** Elemento à direita dentro do campo (ex.: sufixo “.eth”, botão mostrar senha). */
  endAdornment?: ReactNode
  /** Oculta o rótulo visualmente, mantendo-o acessível. */
  hideLabel?: boolean
  id?: string
}

const joinIds = (...ids: (string | false | undefined)[]) => ids.filter(Boolean).join(' ') || undefined

/** Campo com label, dica e erro associados (aria-describedby/aria-invalid) — requisito §8. */
export function TextField({
  label,
  hint,
  error,
  endAdornment,
  hideLabel,
  required,
  className,
  id,
  ...props
}: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`
  const describedBy = joinIds(hint && hintId, error && errorId)

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={inputId} className={cn('text-label font-bold text-foreground', hideLabel && 'sr-only')}>
        {label}
        {required && (
          <span aria-hidden="true" className="ml-1 text-primary">
            *
          </span>
        )}
      </label>
      <div
        className={cn(
          'flex h-11 items-center rounded-sm border bg-surface-raised px-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring',
          error ? 'border-danger' : 'border-border-field',
        )}
      >
        <input
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="h-full min-w-0 flex-1 bg-transparent text-label text-foreground outline-none placeholder:text-foreground-muted"
          {...props}
        />
        {endAdornment}
      </div>
      {hint && (
        <p id={hintId} className="text-caption text-foreground-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-caption text-danger-text">
          {error}
        </p>
      )}
    </div>
  )
}
