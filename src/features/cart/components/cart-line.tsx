import type { ReactNode } from 'react'

import type { CartIssue, CartItem } from '@/contracts'
import { multiplyEth } from '@/shared/lib/money'
import { EthAmount, Icon, IconButton, NftImage, QuantityStepper } from '@/shared/ui'

export interface CartLineProps {
  item: CartItem
  issue: CartIssue | undefined
  /** Quantidade exibida (pode estar à frente do servidor durante o debounce). */
  quantity: number
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
  isRemoving?: boolean
  renderLink: (props: { className: string; children: ReactNode }) => ReactNode
}

/** Aviso da linha: ícone + texto (estado não depende só de cor — §8). */
export function IssueNotice({ issue }: { issue: CartIssue }) {
  const text = {
    PRICE_CHANGED:
      issue.type === 'PRICE_CHANGED' ? `Preço alterado: ${issue.previousEth} → ${issue.currentEth} ETH` : '',
    QUANTITY_REDUCED:
      issue.type === 'QUANTITY_REDUCED' ? `Quantidade ajustada para ${issue.available} (disponível)` : '',
    SOLD_OUT: 'Edição esgotada — não entra no total',
  }[issue.type]
  return (
    <p className="flex items-center gap-2 text-caption font-bold text-danger-text">
      <Icon name="alert-triangle" size={16} />
      {text}
    </p>
  )
}

/** Linha do carrinho: linha de tabela no desktop, card no mobile (Figma). */
export function CartLine({
  item,
  issue,
  quantity,
  onQuantityChange,
  onRemove,
  isRemoving = false,
  renderLink,
}: CartLineProps) {
  const soldOut = issue?.type === 'SOLD_OUT'
  const limit = Math.min(item.available, item.maxPerOrder)
  // Prévia instantânea durante o debounce, calculada em bigint; substituída pela resposta da API.
  const lineTotal = quantity === item.quantity ? item.lineTotalEth : multiplyEth(item.unitPriceEth, quantity)
  return (
    <li
      className="grid grid-cols-[70px_1fr_auto] items-center gap-x-4 gap-y-2 rounded-sm bg-surface pr-4 lg:grid-cols-[70px_minmax(0,1fr)_120px_140px_120px_48px]"
      aria-label={item.nft.name}
    >
      <NftImage
        image={{ ...item.nft.image, alt: '' }}
        sizes="70px"
        className="row-span-2 h-full rounded-l-sm lg:row-span-1"
      />
      <div className="flex min-w-0 flex-col gap-1 py-3">
        <p className="truncate text-body font-bold text-foreground">
          {renderLink({
            className: 'hover:text-primary focus-visible:outline-2 focus-visible:outline-ring',
            children: item.nft.name,
          })}
        </p>
        <p className="text-caption text-foreground-secondary">
          ID do token: {item.nft.tokenId} · Edição: {item.editionLabel}
        </p>
        {issue && <IssueNotice issue={issue} />}
      </div>
      <EthAmount value={item.unitPriceEth} size="sm" className="hidden lg:inline-flex" />
      <div className="col-start-2 lg:col-start-auto">
        <QuantityStepper
          label={`Quantidade de ${item.nft.name}`}
          min={1}
          max={soldOut ? 0 : Math.max(limit, 1)}
          value={quantity}
          onChange={onQuantityChange}
        />
      </div>
      <EthAmount
        value={lineTotal}
        size="sm"
        className="col-start-3 row-start-1 self-end pb-3 lg:col-start-auto lg:row-start-auto lg:self-auto lg:pb-0"
      />
      <IconButton
        icon="trash"
        label={`Remover ${item.nft.name} do carrinho`}
        size="sm"
        onClick={onRemove}
        disabled={isRemoving}
        className="col-start-3 row-start-2 justify-self-end lg:col-start-auto lg:row-start-auto"
      />
    </li>
  )
}
