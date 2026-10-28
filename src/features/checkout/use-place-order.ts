import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { type CreateOrderBody, quoteSchema } from '@/contracts'
import { announce } from '@/shared/a11y'
import { isApiError } from '@/shared/api'
import { queryKeys } from '@/shared/query'

import { checkoutApi } from './api'
import { type CheckoutAttempt, prepareAttempt, recordOrder } from './attempt'

const MAX_RETRIES = 3

/**
 * Envio do pedido (ADR-0012): chave salva antes do envio; falhas transitórias (timeout/rede/5xx)
 * são repetidas com a MESMA chave — a API devolve o mesmo pedido em vez de criar outro.
 */
export function usePlaceOrder(userId: string) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const mutation = useMutation({
    // Cliques repetidos entram na mesma fila e reutilizam a mesma chave.
    scope: { id: 'place-order' },
    mutationFn: (attempt: CheckoutAttempt) => checkoutApi.createOrder(attempt.body, attempt.idempotencyKey),
    retry: (failureCount, error) => isApiError(error) && error.retryable && failureCount < MAX_RETRIES,
    retryDelay: (attempt) => 1000 * 2 ** attempt,
    onSuccess: (order) => {
      recordOrder(order.id)
      queryClient.setQueryData(queryKeys.user.order(userId, order.id), order)
      announce('Pedido enviado. Aguardando a confirmação da rede.', 'polite')
      void navigate({ to: '/orders/$orderId', params: { orderId: order.id }, replace: true })
    },
    onError: (error, attempt) => {
      if (!isApiError(error) || !error.is('QUOTE_STALE')) return
      const fresh = quoteSchema.safeParse(error.details.quote)
      if (fresh.success) queryClient.setQueryData(queryKeys.user.quote(userId, attempt.body.network), fresh.data)
      announce('A cotação mudou. Revise o pedido e confirme novamente.', 'assertive')
    },
  })
  return {
    place: (body: CreateOrderBody) => {
      if (mutation.isPending) return
      mutation.mutate(prepareAttempt(body))
    },
    resume: (attempt: CheckoutAttempt) => {
      if (!mutation.isPending) mutation.mutate(attempt)
    },
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  }
}
