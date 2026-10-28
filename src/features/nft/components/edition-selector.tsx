import { useId } from 'react'

import type { Edition } from '@/contracts'
import { cn } from '@/shared/lib/cn'

export interface EditionSelectorProps {
  editions: Edition[]
  value: string
  onChange: (editionId: string) => void
}

/** Edições como grupo de rádio nativo (teclado com setas); esgotadas ficam desabilitadas com texto. */
export function EditionSelector({ editions, value, onChange }: EditionSelectorProps) {
  const name = useId()
  return (
    <fieldset>
      <legend className="mb-3 text-label font-bold text-foreground">Edição:</legend>
      <div className="flex flex-wrap gap-2">
        {editions.map((edition) => {
          const unavailable = edition.available === 0
          const id = `${name}-${edition.id}`
          return (
            <div key={edition.id}>
              <input
                id={id}
                type="radio"
                name={name}
                value={edition.id}
                checked={edition.id === value}
                disabled={unavailable}
                onChange={() => {
                  onChange(edition.id)
                }}
                className="peer sr-only"
              />
              <label
                htmlFor={id}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-1 rounded-pill border px-3 py-1 text-label uppercase transition-colors',
                  'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring',
                  'peer-checked:border-primary peer-checked:font-bold peer-checked:text-primary',
                  unavailable
                    ? 'cursor-not-allowed border-border-soft text-foreground-muted line-through'
                    : 'border-border-field text-foreground-secondary hover:border-primary',
                )}
              >
                {edition.label}
                {unavailable && <span className="sr-only"> (esgotada)</span>}
              </label>
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}
