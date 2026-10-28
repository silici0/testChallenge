import type { Edition } from '@/contracts'

/** Limite de compra e explicação em texto (o limite não é comunicado só pelo botão desabilitado). */
export function availability(edition: Edition | undefined) {
  if (!edition) return { limit: 0, hint: 'Selecione uma edição' }
  const limit = Math.min(edition.available, edition.maxPerOrder)
  if (limit === 0) return { limit, hint: 'Edição esgotada' }
  const hint =
    edition.available <= edition.maxPerOrder
      ? `Restam ${edition.available} nesta edição`
      : `Máximo de ${edition.maxPerOrder} por pedido`
  return { limit, hint }
}
