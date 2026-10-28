import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link, useRouteContext } from '@tanstack/react-router'
import { useEffect, useSyncExternalStore } from 'react'

import type { Order } from '@/contracts'
import { clearAttempt } from '@/features/checkout/attempt'
import { isApiError } from '@/shared/api'
import { Button, EmptyState, ErrorState, Skeleton, SkeletonRegion } from '@/shared/ui'

import { orderQuery } from './api'
import { OrderDeclined, OrderPending, OrderReceipt } from './components/order-status'

const route = getRouteApi('/orders/$orderId')

/** Visão por estado: recibo só para pedido efetivamente confirmado (§3.3). */
function OrderView({ order }: { order: Order }) {
  if (order.status === 'pending') return <OrderPending order={order} />
  if (order.status === 'declined') {
    return (
      <OrderDeclined
        order={order}
        action={
          <Button asChild>
            <Link to="/cart">Voltar ao carrinho</Link>
          </Button>
        }
      />
    )
  }
  return (
    <OrderReceipt
      order={order}
      explorerLink={
        <Button asChild>
          <Link to="/explorer/tx/$hash" params={{ hash: order.transaction?.hash ?? '' }}>
            Ver no explorador (simulado)
          </Link>
        </Button>
      }
    />
  )
}
const FALLBACK_POLL_MS = 5000

/**
 * Pedido: pendente → confirmado | recusado (terminais). O evento order.updated atualiza o cache;
 * sem socket, o estado é consultado na API (recuperação após queda ou refresh — §7).
 */
export function OrderPage() {
  const { orderId } = route.useParams()
  const { user, realtime } = useRouteContext({ from: '/orders/$orderId' })
  const status = useSyncExternalStore(realtime.subscribeStatus, realtime.getStatus)
  const order = useQuery({
    ...orderQuery(user.id, orderId),
    refetchInterval: (query) =>
      query.state.data?.status === 'pending' && status !== 'connected' ? FALLBACK_POLL_MS : false,
  })
  const terminal = order.data && order.data.status !== 'pending'

  useEffect(() => {
    if (terminal) clearAttempt()
  }, [terminal])

  if (order.isError && isApiError(order.error) && order.error.is('NOT_FOUND', 'FORBIDDEN')) {
    return (
      <EmptyState
        title="Pedido não encontrado"
        action={
          <Button asChild variant="outline">
            <Link to="/">Voltar ao início</Link>
          </Button>
        }
      />
    )
  }
  if (order.isError && !order.data)
    return <ErrorState title="Não foi possível carregar o pedido" onRetry={() => void order.refetch()} />
  if (!order.data) {
    return (
      <SkeletonRegion label="Carregando pedido" className="mx-auto w-full max-w-[580px]">
        <Skeleton className="h-96 w-full" />
      </SkeletonRegion>
    )
  }
  return <OrderView order={order.data} />
}
