import { z } from 'zod'

import { ethSchema, isoDateSchema } from './common'
import { orderStatusSchema, transactionSchema } from './order'

const envelope = <TType extends string, TResource extends string, TData extends z.ZodType>(
  type: TType,
  resource: TResource,
  data: TData,
) =>
  z.object({
    eventId: z.string(),
    type: z.literal(type),
    resource: z.object({ type: z.literal(resource), id: z.string() }),
    version: z.number().int().positive(),
    occurredAt: isoDateSchema,
    userId: z.string().nullable(),
    data,
  })

export const nftUpdatedEventSchema = envelope(
  'nft.updated',
  'nft',
  z.object({
    priceFromEth: ethSchema,
    available: z.number().int().nonnegative(),
    editions: z.array(
      z.object({
        id: z.string(),
        priceEth: ethSchema,
        available: z.number().int().nonnegative(),
        status: z.enum(['available', 'sold-out', 'unavailable']),
      }),
    ),
  }),
)

export const orderUpdatedEventSchema = envelope(
  'order.updated',
  'order',
  z.object({
    status: orderStatusSchema,
    declineReason: z.string().nullable(),
    transaction: transactionSchema.nullable(),
  }),
)

export const walletUpdatedEventSchema = envelope(
  'wallet.updated',
  'wallet',
  z.object({ connection: z.enum(['disconnected', 'connected']) }),
)

export const realtimeEventSchema = z.discriminatedUnion('type', [
  nftUpdatedEventSchema,
  orderUpdatedEventSchema,
  walletUpdatedEventSchema,
])
export type RealtimeEvent = z.infer<typeof realtimeEventSchema>
export type NftUpdatedEvent = z.infer<typeof nftUpdatedEventSchema>
export type OrderUpdatedEvent = z.infer<typeof orderUpdatedEventSchema>
export type WalletUpdatedEvent = z.infer<typeof walletUpdatedEventSchema>

export const REALTIME_EVENT_TYPES = ['nft.updated', 'order.updated', 'wallet.updated'] as const

export const nftSubscriptionSchema = z.object({ nftIds: z.array(z.string()).max(100) })
