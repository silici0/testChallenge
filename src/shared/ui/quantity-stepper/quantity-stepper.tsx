import { useId } from 'react'

import { useQuantityStepper, type UseQuantityStepperParams } from '@/shared/hooks'
import { cn } from '@/shared/lib/cn'

import { Icon } from '../icon'

export interface QuantityStepperProps extends UseQuantityStepperParams {
  /** Rótulo acessível do campo (ex.: “Quantidade de Emerald Ape #042”). */
  label: string
  /** Explicação do limite, ligada ao campo por aria-describedby (o limite não é comunicado só pelo botão desabilitado). */
  limitHint?: string
  className?: string
}

const stepButton = cn(
  'flex size-8 items-center justify-center rounded-pill bg-primary text-on-primary transition-colors',
  'hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
  'disabled:cursor-not-allowed disabled:opacity-40',
)

/** Stepper único para desktop e mobile (comentário #15 do Figma); regras no hook useQuantityStepper. */
export function QuantityStepper({ label, limitHint, className, ...params }: QuantityStepperProps) {
  const stepper = useQuantityStepper(params)
  const inputId = useId()
  const hintId = useId()

  return (
    <div className={cn('inline-flex flex-col gap-1', className)}>
      <div className="inline-flex items-center gap-3">
        <button
          type="button"
          className={stepButton}
          onClick={stepper.decrement}
          disabled={!stepper.canDecrement}
          aria-label="Diminuir quantidade"
          aria-controls={inputId}
        >
          <Icon name="minus" size={18} />
        </button>
        <label htmlFor={inputId} className="sr-only">
          {label}
        </label>
        <input
          id={inputId}
          type="number"
          inputMode="numeric"
          min={stepper.min}
          max={stepper.max}
          step={1}
          value={stepper.value}
          disabled={stepper.isUnavailable}
          aria-describedby={limitHint ? hintId : undefined}
          onChange={(event) => {
            stepper.setFromInput(event.target.value)
          }}
          className="w-10 [appearance:textfield] bg-transparent text-center text-body text-foreground tabular-nums [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          className={stepButton}
          onClick={stepper.increment}
          disabled={!stepper.canIncrement}
          aria-label="Aumentar quantidade"
          aria-controls={inputId}
        >
          <Icon name="plus" size={18} />
        </button>
      </div>
      {limitHint && (
        <p id={hintId} className="text-caption text-foreground-muted">
          {limitHint}
        </p>
      )}
    </div>
  )
}
