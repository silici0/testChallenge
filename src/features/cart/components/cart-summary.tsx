import type { ReactNode } from 'react'

import type { QuoteSummary } from '@/contracts'
import { EthAmount, Skeleton, SkeletonRegion } from '@/shared/ui'

export interface CartSummaryProps {
  summary: QuoteSummary
  title?: string
  coupon?: ReactNode
  actions?: ReactNode
  /** Valores sendo recalculados (mutation ou evento em tempo real). */
  isUpdating?: boolean
}

const row = 'flex items-baseline justify-between gap-4 text-body text-foreground'

/** Resumo de valores — sempre os valores calculados pela API (docs/cart.md). */
export function CartSummary({
  summary,
  title = 'Resumo da carteira',
  coupon,
  actions,
  isUpdating = false,
}: CartSummaryProps) {
  const hasDiscount = summary.discountEth !== '0'
  return (
    <section aria-labelledby="summary-title" aria-busy={isUpdating} className="flex flex-col gap-5">
      <h2 id="summary-title" className="border-b border-border-soft pb-3 text-title font-bold text-foreground">
        {title}
      </h2>
      {coupon}
      <dl className="flex flex-col gap-3">
        <div className={row}>
          <dt>Subtotal</dt>
          <dd>
            <EthAmount value={summary.subtotalEth} tone="default" size="sm" />
          </dd>
        </div>
        <div className={row}>
          <dt>
            {summary.coupon?.status === 'applied' ? `Desconto (${summary.coupon.code})` : 'Desconto do lançamento'}
          </dt>
          <dd>
            <EthAmount
              value={summary.discountEth}
              negative={hasDiscount}
              tone={hasDiscount ? 'accent' : 'default'}
              size="sm"
            />
          </dd>
        </div>
        <div className={row}>
          <dt>Taxa de rede</dt>
          <dd className="flex flex-col items-end">
            <EthAmount value={summary.networkFeeEth} tone="default" size="sm" />
            <span className="text-tiny text-primary">Taxa estimada</span>
          </dd>
        </div>
        <div className={`${row} border-t border-border-soft pt-4 font-bold`}>
          <dt>Total</dt>
          <dd>
            <EthAmount value={summary.totalEth} size="md" />
          </dd>
        </div>
      </dl>
      {actions}
    </section>
  )
}

/** Mesmas proporções do resumo final (sem deslocamento de layout). */
export function CartSummarySkeleton() {
  return (
    <SkeletonRegion label="Carregando resumo do carrinho" className="flex flex-col gap-5">
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="h-11 w-full" />
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-6 w-full" />
      ))}
      <Skeleton className="h-12 w-full" />
    </SkeletonRegion>
  )
}
