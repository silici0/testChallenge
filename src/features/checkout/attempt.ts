import { z } from 'zod'

import { type CreateOrderBody, createOrderBodySchema } from '@/contracts'
import { safeStorage } from '@/shared/lib/storage'

const KEY = 'checkout:attempt'

const attemptSchema = z.object({
  idempotencyKey: z.string(),
  body: createOrderBodySchema,
  orderId: z.string().nullable(),
})
export type CheckoutAttempt = z.infer<typeof attemptSchema>

/** JSON com chaves ordenadas: corpos equivalentes comparam iguais. */
const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

export function loadAttempt(): CheckoutAttempt | null {
  const parsed = attemptSchema.safeParse(safeStorage.getJson('session', KEY))
  return parsed.success ? parsed.data : null
}

/**
 * Chave de idempotência por tentativa (ADR-0012): salva ANTES do envio. O mesmo corpo reutiliza a
 * mesma chave — retries após timeout, cliques repetidos e refresh recuperam o mesmo pedido.
 */
export function prepareAttempt(body: CreateOrderBody): CheckoutAttempt {
  const previous = loadAttempt()
  if (previous && canonical(previous.body) === canonical(body)) return previous
  const attempt: CheckoutAttempt = { idempotencyKey: crypto.randomUUID(), body, orderId: null }
  safeStorage.setJson('session', KEY, attempt)
  return attempt
}

export function recordOrder(orderId: string): void {
  const attempt = loadAttempt()
  if (attempt) safeStorage.setJson('session', KEY, { ...attempt, orderId })
}

export function clearAttempt(): void {
  safeStorage.remove('session', KEY)
}
