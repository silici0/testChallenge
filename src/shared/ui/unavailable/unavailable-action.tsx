import { type ReactNode, useId } from 'react'

import { cn } from '@/shared/lib/cn'

import { Button, type ButtonProps } from '../button'

export const UNAVAILABLE_HINT = 'Indisponível na demonstração'

export interface UnavailableActionProps extends Omit<ButtonProps, 'onClick' | 'aria-disabled' | 'asChild'> {
  children: ReactNode
  /** Variante textual (itens de menu/rodapé) em vez de botão. */
  appearance?: 'button' | 'text'
}

/**
 * Ação fora do escopo do desafio (editorial, suporte, login social…): continua visível e focável,
 * mas declara que está indisponível e não simula sucesso (enunciado §3).
 */
export function UnavailableAction({ children, appearance = 'button', className, ...props }: UnavailableActionProps) {
  const hintId = useId()
  const hint = (
    <span id={hintId} className="sr-only">
      ({UNAVAILABLE_HINT})
    </span>
  )
  if (appearance === 'text') {
    return (
      <button
        type="button"
        aria-disabled="true"
        aria-describedby={hintId}
        title={UNAVAILABLE_HINT}
        className={cn(
          'cursor-not-allowed text-left text-label text-foreground-secondary decoration-dotted hover:underline',
          className,
        )}
      >
        {children}
        {hint}
      </button>
    )
  }
  return (
    <Button aria-disabled aria-describedby={hintId} title={UNAVAILABLE_HINT} className={className} {...props}>
      {children}
      {hint}
    </Button>
  )
}
