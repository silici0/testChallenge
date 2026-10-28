import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { type CartItem, nftListParamsSchema } from '@/contracts'
import { nftListQuery } from '@/features/catalog/api'
import { NftCard } from '@/features/catalog/components/nft-card'
import { useNftSubscription } from '@/features/nft/use-nft-subscription'
import { isApiError } from '@/shared/api'
import { Breadcrumb, Button, EmptyState, ErrorState, Skeleton, SkeletonRegion } from '@/shared/ui'

import { CartLine } from './components/cart-line'
import { CartSummary, CartSummarySkeleton } from './components/cart-summary'
import { CouponForm } from './components/coupon-form'
import { useCart } from './use-cart'
import { useCartMutations } from './use-cart-mutations'
import { useLineQuantity } from './use-line-quantity'

function Line({ item, issue }: { item: CartItem; issue: Parameters<typeof CartLine>[0]['issue'] }) {
  const { updateQuantity, remove } = useCartMutations()
  const { quantity, setQuantity } = useLineQuantity({
    serverQuantity: item.quantity,
    commit: (next) => {
      updateQuantity.mutate({ itemId: item.id, quantity: next })
    },
  })
  return (
    <CartLine
      item={item}
      issue={issue}
      quantity={quantity}
      onQuantityChange={setQuantity}
      onRemove={() => {
        remove.mutate({ itemId: item.id, name: item.nft.name })
      }}
      isRemoving={remove.isPending}
      renderLink={(props) => <Link to="/nfts/$nftId" params={{ nftId: item.nftId }} {...props} />}
    />
  )
}

function Coupon({ appliedCode }: { appliedCode: string | null }) {
  const { applyCoupon, removeCoupon } = useCartMutations()
  const error = isApiError(applyCoupon.error)
    ? (applyCoupon.error.fieldErrors.code?.[0] ?? applyCoupon.error.message)
    : undefined
  return (
    <CouponForm
      appliedCode={appliedCode}
      onApply={(code) => {
        applyCoupon.mutate(code)
      }}
      onRemove={() => {
        removeCoupon.mutate()
      }}
      isPending={applyCoupon.isPending || removeCoupon.isPending}
      error={error}
    />
  )
}

function AlsoViewed() {
  const { data } = useQuery(nftListQuery(nftListParamsSchema.parse({ sort: 'popular', pageSize: 5 })))
  if (!data) return null
  return (
    <section aria-labelledby="also-viewed" className="flex flex-col gap-8">
      <h2 id="also-viewed" className="border-b border-border-soft pb-3 text-body-lg font-bold text-primary">
        Colecionadores também viram
      </h2>
      <ul className="flex snap-x gap-6 overflow-x-auto pb-2 lg:grid lg:grid-cols-5 lg:overflow-visible">
        {data.items.map((nft) => (
          <li key={nft.id} className="w-44 shrink-0 snap-start lg:w-auto">
            <NftCard
              nft={nft}
              renderLink={(props) => <Link to="/nfts/$nftId" params={{ nftId: nft.id }} {...props} />}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

function LinesSkeleton() {
  return (
    <SkeletonRegion label="Carregando itens do carrinho" className="flex flex-col gap-3">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-[70px] w-full" />
      ))}
    </SkeletonRegion>
  )
}

function CartContent() {
  const cart = useCart()
  const { updateQuantity, applyCoupon, removeCoupon, remove } = useCartMutations()
  useNftSubscription(cart.data?.items.map((item) => item.nftId) ?? [])
  const isUpdating =
    cart.isFetching || [updateQuantity, applyCoupon, removeCoupon, remove].some((mutation) => mutation.isPending)

  if (cart.isError && !cart.data) {
    return (
      <ErrorState
        title="Não foi possível carregar o carrinho"
        onRetry={() => void cart.refetch()}
        isRetrying={cart.isFetching}
      />
    )
  }
  if (cart.data?.items.length === 0) {
    return (
      <EmptyState
        title="Seu carrinho está vazio"
        description="Explore o catálogo e adicione NFTs para continuar."
        action={
          <Button asChild>
            <Link to="/" hash="catalogo">
              Explorar NFTs
            </Link>
          </Button>
        }
      />
    )
  }
  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_332px] lg:gap-20">
      <section aria-labelledby="cart-items-title" className="flex flex-col gap-3">
        <h2 id="cart-items-title" className="sr-only">
          Itens do carrinho
        </h2>
        <div
          aria-hidden="true"
          className="hidden grid-cols-[70px_minmax(0,1fr)_120px_140px_120px_48px] gap-x-4 border-b border-border-soft pb-3 text-body font-bold text-foreground lg:grid"
        >
          <span className="col-span-2">NFTs</span>
          <span>Preço</span>
          <span>Edições</span>
          <span>Total</span>
        </div>
        {cart.data ? (
          <ul className="flex flex-col gap-3">
            {cart.data.items.map((item) => (
              <Line key={item.id} item={item} issue={cart.data.issues.find((issue) => issue.itemId === item.id)} />
            ))}
          </ul>
        ) : (
          <LinesSkeleton />
        )}
      </section>
      <aside aria-label="Resumo do pedido">
        {cart.data ? (
          <CartSummary
            summary={cart.data.summary}
            isUpdating={isUpdating}
            coupon={<Coupon appliedCode={cart.data.couponCode} />}
            actions={
              <div className="flex flex-col items-center gap-4">
                <Button asChild fullWidth size="lg">
                  <Link to="/checkout">Conectar e finalizar</Link>
                </Button>
                <Link
                  to="/"
                  hash="catalogo"
                  className="text-label text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                >
                  Continuar explorando
                </Link>
              </div>
            }
          />
        ) : (
          <CartSummarySkeleton />
        )}
      </aside>
    </div>
  )
}

export function CartPage() {
  return (
    <div className="flex flex-col gap-section">
      <div className="flex flex-col gap-6">
        <Breadcrumb
          items={[
            { label: 'Início', render: (props) => <Link to="/" {...props} /> },
            { label: 'Mercado', render: (props) => <Link to="/" hash="catalogo" {...props} /> },
            { label: 'Carrinho' },
          ]}
        />
        <h1 className="text-h1 font-bold text-foreground">Carrinho</h1>
        <CartContent />
      </div>
      <AlsoViewed />
    </div>
  )
}
