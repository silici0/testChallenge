import { useId } from 'react'

import { Checkbox } from '@/shared/ui'

export interface FilterOption {
  id: string
  label: string
  count: number
}

export interface FilterGroupProps {
  legend: string
  options: FilterOption[]
  selected: string[]
  onToggle: (id: string, checked: boolean) => void
}

/** Grupo de filtros combináveis (checkboxes — comentário #4 do Figma) com contagem facetada. */
export function FilterGroup({ legend, options, selected, onToggle }: FilterGroupProps) {
  const groupId = useId()
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-4 text-body-lg font-bold text-foreground">{legend}</legend>
      <ul className="flex flex-col gap-3">
        {options.map((option) => {
          const id = `${groupId}-${option.id}`
          const checked = selected.includes(option.id)
          return (
            <li key={option.id} className="flex items-center gap-3">
              <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={(value) => {
                  onToggle(option.id, value === true)
                }}
              />
              <label htmlFor={id} className="flex flex-1 cursor-pointer items-center justify-between text-label">
                <span className={checked ? 'font-bold text-primary' : 'text-foreground-secondary'}>{option.label}</span>
                <span className="text-foreground-secondary tabular-nums">
                  <span className="sr-only">, </span>({option.count})
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}
