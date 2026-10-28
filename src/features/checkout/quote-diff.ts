import type { CartItem, Quote } from '@/contracts'

export interface QuoteChange {
  label: string
  previous: string
  current: string
}

/** Diferenças entre a cotação revisada e a atual (preço, quantidade, taxa, desconto, total). */
export function diffQuotes(reviewed: Quote, current: Quote, names: Record<string, string>): QuoteChange[] {
  const changes: QuoteChange[] = []
  for (const item of reviewed.items) {
    const now = current.items.find((candidate) => candidate.itemId === item.itemId)
    const name = names[item.itemId] ?? item.nftId
    if (!now) changes.push({ label: `${name}: indisponível`, previous: `${item.quantity} un.`, current: '0 un.' })
    else if (now.quantity !== item.quantity)
      changes.push({ label: `${name}: quantidade`, previous: `${item.quantity}`, current: `${now.quantity}` })
    else if (now.unitPriceEth !== item.unitPriceEth)
      changes.push({
        label: `${name}: preço`,
        previous: `${item.unitPriceEth} ETH`,
        current: `${now.unitPriceEth} ETH`,
      })
  }
  const totals = [
    ['Taxa de rede', reviewed.networkFeeEth, current.networkFeeEth],
    ['Desconto', reviewed.discountEth, current.discountEth],
    ['Total', reviewed.totalEth, current.totalEth],
  ] as const
  for (const [label, previous, now] of totals)
    if (previous !== now) changes.push({ label, previous: `${previous} ETH`, current: `${now} ETH` })
  return changes
}

/** Mudanças entre a cotação revisada e a atual, com nomes dos itens do carrinho. */
export function quoteChanges(
  reviewed: Quote | null,
  current: Quote | undefined,
  cartItems: CartItem[] = [],
): QuoteChange[] {
  if (!reviewed || !current) return []
  return diffQuotes(reviewed, current, Object.fromEntries(cartItems.map((item) => [item.id, item.nft.name])))
}
