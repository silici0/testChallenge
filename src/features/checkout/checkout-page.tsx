import { Link, Navigate, useRouteContext } from '@tanstack/react-router'

import { CartSummary, CartSummarySkeleton } from '@/features/cart/components/cart-summary'
import { Breadcrumb, Button, EmptyState, ErrorState } from '@/shared/ui'

import { BuyerForm } from './components/buyer-form'
import { QuoteItems } from './components/quote-items'
import { ReviewDialog } from './components/review-dialog'
import { WalletPicker } from './components/wallet-picker'
import { type CheckoutFlow, orderErrorMessage, useCheckoutFlow } from './use-checkout-flow'

function PendingAttemptBanner({ flow }: { flow: CheckoutFlow }) {
  const { attempt, place } = flow
  if (!attempt || attempt.orderId) return null
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-primary bg-primary/10 p-4"
    >
      <p className="text-label text-foreground">Você tem um pedido em andamento que não foi concluído.</p>
      <Button size="sm" onClick={() => place.resume(attempt)} isLoading={place.isPending} loadingText="Retomando…">
        Retomar pedido
      </Button>
    </div>
  )
}

function QuoteSummary({ flow }: { flow: CheckoutFlow }) {
  const { quote, cart } = flow
  if (quote.isError && !quote.data)
    return <ErrorState title="Não foi possível calcular a cotação" onRetry={() => void quote.refetch()} />
  if (!quote.data) return <CartSummarySkeleton />
  return (
    <CartSummary
      title="Seus NFTs"
      summary={quote.data}
      isUpdating={quote.isFetching}
      coupon={
        <>
          <QuoteItems quote={quote.data} cartItems={cart.data?.items ?? []} />
          <Link
            to="/cart"
            className="text-center text-label text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
          >
            {quote.data.coupon ? `Cupom ${quote.data.coupon.code}` : 'Tem um código promocional? Aplique aqui'}
          </Link>
        </>
      }
    />
  )
}

function WalletSection({ flow }: { flow: CheckoutFlow }) {
  const { selection } = flow
  if (!selection.isLoaded) return null
  return (
    <WalletPicker
      wallets={selection.items}
      selectedId={selection.wallet?.id}
      onSelect={selection.setSelectedId}
      onConnect={(wallet) => {
        selection.mutations.connect.mutate({ walletId: wallet.id, network: wallet.network })
      }}
      onDisconnect={(wallet) => {
        selection.mutations.disconnect.mutate(wallet.id)
      }}
      isConnecting={selection.mutations.connect.isPending}
      error={selection.error}
    />
  )
}

function Review({ flow }: { flow: CheckoutFlow }) {
  const { reviewed, buyer, selection, quote, changes, place } = flow
  if (!reviewed || !buyer || !selection.wallet || !quote.data) return null
  return (
    <ReviewDialog
      open
      onOpenChange={(open) => {
        if (!open) flow.closeReview()
      }}
      buyer={buyer}
      wallet={selection.wallet}
      quote={quote.data}
      changes={changes}
      onAcceptChanges={flow.acceptChanges}
      onConfirm={flow.confirm}
      isSubmitting={place.isPending}
      error={orderErrorMessage(place.error)}
    />
  )
}

function EmptyCheckout() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 font-bold text-foreground">Pagamento</h1>
      <EmptyState
        title="Seu carrinho está vazio"
        description="Adicione NFTs ao carrinho para finalizar a compra."
        action={
          <Button asChild>
            <Link to="/" hash="catalogo">
              Explorar NFTs
            </Link>
          </Button>
        }
      />
    </div>
  )
}

/** Pagamento (Figma: Desktop/Mobile Pagamento): comprador, carteira e rede, cotação, revisão e envio. */
export function CheckoutPage() {
  const { user } = useRouteContext({ from: '/checkout' })
  const flow = useCheckoutFlow(user)

  if (flow.attempt?.orderId)
    return <Navigate to="/orders/$orderId" params={{ orderId: flow.attempt.orderId }} replace />
  if (flow.cart.data && !flow.hasItems && !flow.attempt) return <EmptyCheckout />

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: 'Início', render: (props) => <Link to="/" {...props} /> },
          { label: 'Mercado', render: (props) => <Link to="/" hash="catalogo" {...props} /> },
          { label: 'Pagamento' },
        ]}
      />
      <h1 className="text-h1 font-bold text-foreground">Pagamento</h1>
      <PendingAttemptBanner flow={flow} />
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_405px]">
        <BuyerForm defaults={flow.defaults} onDraftChange={flow.saveDraft} register={flow.registerBuyerForm} />
        <aside aria-label="Resumo do pedido" className="flex flex-col gap-8">
          <QuoteSummary flow={flow} />
          <WalletSection flow={flow} />
          {flow.reviewError && (
            <p role="alert" className="text-label text-danger-text">
              {flow.reviewError}
            </p>
          )}
          <Button size="lg" fullWidth onClick={() => void flow.openReview()}>
            Revisar pedido
          </Button>
        </aside>
      </div>
      <Review flow={flow} />
    </div>
  )
}
