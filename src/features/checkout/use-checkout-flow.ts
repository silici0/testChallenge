import { useQuery } from '@tanstack/react-query'
import { useCallback, useMemo, useRef, useState } from 'react'

import { type Buyer, buyerSchema, type Quote, type User } from '@/contracts'
import { useCart } from '@/features/cart/use-cart'
import { useNftSubscription } from '@/features/nft/use-nft-subscription'
import { walletsQuery } from '@/features/wallets/api'
import { useWalletMutations } from '@/features/wallets/use-wallet-mutations'
import { isApiError } from '@/shared/api'
import { safeStorage } from '@/shared/lib/storage'

import { quoteQuery } from './api'
import { loadAttempt } from './attempt'
import type { BuyerFormHandle } from './components/buyer-form'
import { quoteChanges } from './quote-diff'
import { usePlaceOrder } from './use-place-order'

const DRAFT_KEY = 'checkout:draft'

/** Rascunho do comprador (sem dados sensíveis) para retomar após expiração de sessão. */
function initialBuyer(user: User): Buyer {
  const draft = buyerSchema.safeParse(safeStorage.getJson('session', DRAFT_KEY))
  return draft.success
    ? draft.data
    : { displayName: user.displayName, username: user.username, email: user.email, referralCode: null, note: null }
}

export function walletErrorMessage(error: unknown): string | undefined {
  if (!isApiError(error)) return undefined
  if (error.is('WALLET_REJECTED'))
    return 'A conexão foi recusada na carteira. Tente novamente ou escolha outra carteira.'
  return error.message
}

export function orderErrorMessage(error: unknown): string | undefined {
  if (!error) return undefined
  if (!isApiError(error)) return 'Não foi possível enviar o pedido.'
  if (error.is('QUOTE_STALE')) return undefined
  if (error.retryable)
    return 'Falha de conexão ao enviar o pedido. Tente novamente: o mesmo pedido será recuperado, sem compra duplicada.'
  return error.message
}

function useWalletSelection(userId: string) {
  const wallets = useQuery(walletsQuery(userId))
  const mutations = useWalletMutations(userId)
  const [selectedId, setSelectedId] = useState<string>()
  const items = wallets.data?.items ?? []
  const wallet =
    items.find((item) => item.id === selectedId) ?? items.find((item) => item.connection === 'connected') ?? items[0]
  return {
    isLoaded: Boolean(wallets.data),
    items,
    wallet,
    setSelectedId,
    mutations,
    error: walletErrorMessage(mutations.connect.error),
  }
}
export type WalletSelection = ReturnType<typeof useWalletSelection>

/**
 * Estado do pagamento (docs/checkout.md): comprador, carteira, cotação da API, revisão e envio.
 * A confirmação só usa a cotação revisada; qualquer diferença com a cotação atual exige nova revisão.
 */
export function useCheckoutFlow(user: User) {
  const cart = useCart()
  const selection = useWalletSelection(user.id)
  const network = selection.wallet?.network ?? 'ethereum'
  const hasItems = (cart.data?.items.length ?? 0) > 0
  const quote = useQuery({ ...quoteQuery(user.id, network), enabled: hasItems })
  const place = usePlaceOrder(user.id)
  useNftSubscription(cart.data?.items.map((item) => item.nftId) ?? [])

  const [attempt] = useState(loadAttempt)
  const defaults = useMemo(() => initialBuyer(user), [user])
  const buyerForm = useRef<BuyerFormHandle | null>(null)
  const [buyer, setBuyer] = useState<Buyer | null>(null)
  const [reviewed, setReviewed] = useState<Quote | null>(null)
  const [reviewError, setReviewError] = useState<string>()
  const saveDraft = useCallback((draft: Buyer) => {
    safeStorage.setJson('session', DRAFT_KEY, draft)
  }, [])

  const changes = quoteChanges(reviewed, quote.data, cart.data?.items)
  const registerBuyerForm = useCallback((handle: BuyerFormHandle) => {
    buyerForm.current = handle
  }, [])

  const openReview = async () => {
    setReviewError(undefined)
    const values = await buyerForm.current?.validate()
    if (!values) return
    if (selection.wallet?.connection !== 'connected') {
      setReviewError('Conecte uma carteira para continuar.')
      return
    }
    if (!quote.data?.items.length) {
      setReviewError('Não há itens disponíveis para comprar.')
      return
    }
    place.reset()
    setBuyer(values)
    setReviewed(quote.data)
  }

  const confirm = () => {
    const wallet = selection.wallet
    if (!reviewed || !buyer || !wallet || changes.length > 0 || wallet.connection !== 'connected') return
    // Sem diferença de valores, a cotação atual (mais recente) é a referência enviada.
    place.place({ quoteId: quote.data?.id ?? reviewed.id, walletId: wallet.id, network, buyer })
  }

  return {
    cart,
    selection,
    quote,
    place,
    attempt,
    defaults,
    registerBuyerForm,
    buyer,
    reviewed,
    reviewError,
    changes,
    hasItems,
    saveDraft,
    openReview,
    confirm,
    closeReview: () => setReviewed(null),
    acceptChanges: () => setReviewed(quote.data ?? null),
  }
}
export type CheckoutFlow = ReturnType<typeof useCheckoutFlow>
