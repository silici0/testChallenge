import { z } from 'zod'

import { cartIssueSchema, quoteSummarySchema } from './cart'
import { ethSchema, isoDateSchema, networkSchema } from './common'

export const quoteSchema = quoteSummarySchema.extend({
  id: z.string(),
  cartVersion: z.number().int().positive(),
  network: networkSchema,
  items: z.array(
    z.object({
      itemId: z.string(),
      nftId: z.string(),
      editionId: z.string(),
      quantity: z.number().int().positive(),
      unitPriceEth: ethSchema,
      lineTotalEth: ethSchema,
    }),
  ),
  issues: z.array(cartIssueSchema),
  expiresAt: isoDateSchema,
})
export type Quote = z.infer<typeof quoteSchema>

export const createQuoteBodySchema = z.object({ network: networkSchema })

export const quoteChangeSchema = z.object({
  field: z.enum(['price', 'availability', 'coupon', 'fee', 'expired']),
  itemId: z.string().nullable(),
  previous: z.string().nullable(),
  current: z.string().nullable(),
})
export type QuoteChange = z.infer<typeof quoteChangeSchema>
