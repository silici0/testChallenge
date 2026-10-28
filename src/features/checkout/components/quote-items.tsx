import type { CartItem, Quote } from '@/contracts'
import { EthAmount, NftImage } from '@/shared/ui'

import type { QuoteChange } from '../quote-diff'

/** Itens da cotação com nome/imagem do carrinho (Figma: “Seus NFTs”). */
export function QuoteItems({ quote, cartItems }: { quote: Quote; cartItems: CartItem[] }) {
  return (
    <ul className="flex flex-col gap-3" aria-label="Itens do pedido">
      {quote.items.map((item) => {
        const cartItem = cartItems.find((candidate) => candidate.id === item.itemId)
        return (
          <li
            key={item.itemId}
            className="grid grid-cols-[56px_1fr_auto] items-center gap-3 rounded-sm bg-surface pr-3"
          >
            {cartItem ? (
              <NftImage image={{ ...cartItem.nft.image, alt: '' }} sizes="56px" className="rounded-l-sm" />
            ) : (
              <span />
            )}
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-label font-bold text-foreground">{cartItem?.nft.name ?? item.nftId}</span>
              <span className="text-caption text-foreground-secondary">
                {cartItem ? `ID do token: ${cartItem.nft.tokenId} · ` : ''}(x {item.quantity})
              </span>
            </span>
            <EthAmount value={item.lineTotalEth} size="sm" />
          </li>
        )
      })}
    </ul>
  )
}

export function QuoteChangesNotice({ changes }: { changes: QuoteChange[] }) {
  if (changes.length === 0) return null
  return (
    <div role="alert" className="flex flex-col gap-2 rounded-sm border border-danger bg-danger/10 p-4">
      <p className="text-label font-bold text-danger-text">
        A cotação mudou desde a sua revisão. Revise e confirme novamente.
      </p>
      <ul className="flex flex-col gap-1 text-caption text-foreground">
        {changes.map((change) => (
          <li key={change.label}>
            {change.label}: {change.previous} → {change.current}
          </li>
        ))}
      </ul>
    </div>
  )
}
