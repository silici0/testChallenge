import { type SyntheticEvent, useState } from 'react'

import { formatEth, isEthString, parseEth } from '@/shared/lib/money'
import { Button, Slider, TextField } from '@/shared/ui'

/** O slider trabalha em centésimos de ETH; os campos aceitam o valor decimal exato. */
const toCents = (eth: string) => Number(parseEth(eth) / 10n ** 16n)
const fromCents = (cents: number) => formatEth(BigInt(cents) * 10n ** 16n)
const display = (eth: string) => eth.replace('.', ',')

export interface PriceRangeFilterProps {
  bounds: { minEth: string; maxEth: string }
  value: { min?: string | undefined; max?: string | undefined }
  onApply: (range: { min: string | undefined; max: string | undefined }) => void
}

/**
 * Faixa de preço: slider de duas alças (fiel ao Figma) sincronizado com campos mín./máx.
 * (comentário #5: precisão e teclado). Aplicada explicitamente pelo botão “Aplicar”.
 */
export function PriceRangeFilter({ bounds, value, onApply }: PriceRangeFilterProps) {
  const [min, setMin] = useState(value.min ?? bounds.minEth)
  const [max, setMax] = useState(value.max ?? bounds.maxEth)
  const [error, setError] = useState<string>()

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isEthString(min) || !isEthString(max)) {
      setError('Use valores como 0.5 ou 12.30')
      return
    }
    if (parseEth(min) > parseEth(max)) {
      setError('O mínimo deve ser menor que o máximo')
      return
    }
    setError(undefined)
    onApply({ min: min === bounds.minEth ? undefined : min, max: max === bounds.maxEth ? undefined : max })
  }

  const sliderValue =
    isEthString(min) && isEthString(max)
      ? [toCents(min), toCents(max)]
      : [toCents(bounds.minEth), toCents(bounds.maxEth)]

  return (
    <form onSubmit={submit} aria-labelledby="price-range-title" className="flex flex-col gap-4">
      <h3 id="price-range-title" className="text-body-lg font-bold text-foreground">
        Faixa de preço
      </h3>
      <Slider
        min={toCents(bounds.minEth)}
        max={toCents(bounds.maxEth)}
        step={1}
        value={sliderValue}
        thumbLabels={['Preço mínimo', 'Preço máximo']}
        onValueChange={([nextMin = 0, nextMax = 0]) => {
          setMin(fromCents(nextMin))
          setMax(fromCents(nextMax))
        }}
      />
      <p className="text-label text-foreground-secondary" aria-live="polite">
        Preço: {display(min)} - {display(max)} ETH
      </p>
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Mínimo (ETH)"
          inputMode="decimal"
          value={min}
          onChange={(event) => setMin(event.target.value.replace(',', '.'))}
        />
        <TextField
          label="Máximo (ETH)"
          inputMode="decimal"
          value={max}
          onChange={(event) => setMax(event.target.value.replace(',', '.'))}
        />
      </div>
      {error && (
        <p role="alert" className="text-caption text-danger-text">
          {error}
        </p>
      )}
      <Button type="submit" size="sm" className="self-start">
        Aplicar
      </Button>
    </form>
  )
}
