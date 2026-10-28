import type { ReactNode } from 'react'

import type { Edition } from '@/contracts'
import { Button, EthAmount, IconButton, QuantityStepper } from '@/shared/ui'

import { availability } from './availability'
import { EditionSelector } from './edition-selector'

export interface PurchasePanelProps {
  nftName: string
  editions: Edition[]
  edition: Edition | undefined
  onEditionChange: (editionId: string) => void
  quantity: number
  onQuantityChange: (quantity: number) => void
  onBuy: () => void
  onAddToCart: () => void
  isSubmitting: boolean
  error: string | undefined
  favorite: ReactNode
}

/**
 * Edição, quantidade e ações. No mobile, quantidade/preço/ações ficam numa barra fixa (Figma mobile).
 * Sem edição disponível, a compra é desabilitada com explicação em texto.
 */
export function PurchasePanel(props: PurchasePanelProps) {
  const {
    nftName,
    editions,
    edition,
    onEditionChange,
    quantity,
    onQuantityChange,
    onBuy,
    onAddToCart,
    isSubmitting,
    error,
    favorite,
  } = props
  const { limit, hint } = availability(edition)
  const unavailable = limit === 0
  return (
    <div className="flex flex-col gap-5">
      <EditionSelector editions={editions} value={edition?.id ?? ''} onChange={onEditionChange} />
      <div className="fixed inset-x-0 bottom-16 z-30 flex flex-col gap-3 border-t border-border-soft bg-surface p-4 lg:static lg:border-0 lg:bg-transparent lg:p-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-label font-bold text-foreground-secondary lg:sr-only" aria-hidden="true">
              Qtd.
            </span>
            <QuantityStepper
              key={edition?.id}
              label={`Quantidade de ${nftName}`}
              min={1}
              max={limit}
              value={Math.min(quantity, Math.max(limit, 1))}
              onChange={onQuantityChange}
              limitHint={hint}
            />
          </div>
          {edition && <EthAmount value={edition.priceEth} size="lg" className="lg:hidden" />}
          <div className="flex flex-1 items-center justify-end gap-3">
            <Button
              uppercase
              onClick={onBuy}
              isLoading={isSubmitting}
              loadingText="Adicionando…"
              aria-disabled={unavailable || undefined}
              className="flex-1 lg:flex-none"
            >
              Comprar
            </Button>
            <IconButton
              icon="cart"
              label={`Adicionar ${nftName} ao carrinho`}
              onClick={onAddToCart}
              disabled={unavailable || isSubmitting}
              className="border border-border-field"
            />
            <div className="hidden lg:block">{favorite}</div>
          </div>
        </div>
        {error && (
          <p role="alert" className="text-label text-danger-text">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
