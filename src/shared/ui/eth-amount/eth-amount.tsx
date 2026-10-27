import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/shared/lib/cn'
import { type EthString, formatEth, parseEth } from '@/shared/lib/money'

const ethAmountVariants = cva('font-mono whitespace-nowrap tabular-nums', {
  variants: {
    tone: { accent: 'font-bold text-accent', default: 'text-foreground', muted: 'text-foreground-secondary' },
    size: { sm: 'text-label', md: 'text-body-lg', lg: 'text-h3' },
  },
  defaultVariants: { tone: 'accent', size: 'md' },
})

export interface EthAmountProps extends VariantProps<typeof ethAmountVariants> {
  /** Valor como string decimal vinda da API (ADR-0011). */
  value: EthString
  /** Valor anterior (ex.: preço alterado em tempo real), exibido riscado. */
  previousValue?: EthString | undefined
  /** Exibe sinal de subtração (descontos). */
  negative?: boolean
  className?: string
}

const display = (value: EthString) => formatEth(parseEth(value))

/** Exibe valores em ETH sem arredondar (precisão exigida no §3.2 do enunciado). */
export function EthAmount({ value, previousValue, negative = false, tone, size, className }: EthAmountProps) {
  const text = `${negative ? '− ' : ''}${display(value)} ETH`
  return (
    <span className={cn('inline-flex items-baseline gap-2', className)}>
      {previousValue !== undefined && (
        <del className="text-label text-foreground-muted">
          <span className="sr-only">Antes: </span>
          {display(previousValue)} ETH
        </del>
      )}
      <data value={value} className={ethAmountVariants({ tone, size })}>
        {previousValue !== undefined && <span className="sr-only">Agora: </span>}
        {text}
      </data>
    </span>
  )
}
