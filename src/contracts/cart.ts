import { z } from 'zod'

import { ethSchema, imageSchema, quantitySchema } from './common'

export const couponSummarySchema = z.object({
  code: z.string(),
  status: z.enum(['applied', 'invalid', 'expired']),
  description: z.string(),
})

export const quoteSummarySchema = z.object({
  subtotalEth: ethSchema,
  discountEth: ethSchema,
  networkFeeEth: ethSchema,
  totalEth: ethSchema,
  coupon: couponSummarySchema.nullable(),
})
export type QuoteSummary = z.infer<typeof quoteSummarySchema>

export const cartIssueSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('PRICE_CHANGED'), itemId: z.string(), previousEth: ethSchema, currentEth: ethSchema }),
  z.object({
    type: z.literal('QUANTITY_REDUCED'),
    itemId: z.string(),
    requested: z.number().int(),
    available: z.number().int(),
  }),
  z.object({ type: z.literal('SOLD_OUT'), itemId: z.string() }),
])
export type CartIssue = z.infer<typeof cartIssueSchema>

export const cartItemSchema = z.object({
  id: z.string(),
  nftId: z.string(),
  editionId: z.string(),
  nft: z.object({ id: z.string(), name: z.string(), tokenId: z.string(), image: imageSchema }),
  editionLabel: z.string(),
  quantity: quantitySchema,
  unitPriceEth: ethSchema,
  lineTotalEth: ethSchema,
  available: z.number().int().nonnegative(),
  maxPerOrder: z.number().int().positive(),
})
export type CartItem = z.infer<typeof cartItemSchema>

export const cartSchema = z.object({
  id: z.string(),
  ownerType: z.enum(['guest', 'user']),
  version: z.number().int().positive(),
  items: z.array(cartItemSchema),
  couponCode: z.string().nullable(),
  summary: quoteSummarySchema,
  issues: z.array(cartIssueSchema),
})
export type Cart = z.infer<typeof cartSchema>

export const addCartItemBodySchema = z.object({ nftId: z.string(), editionId: z.string(), quantity: quantitySchema })
export type AddCartItemBody = z.infer<typeof addCartItemBodySchema>

export const updateCartItemBodySchema = z.object({ quantity: quantitySchema })

export const applyCouponBodySchema = z.object({ code: z.string().trim().min(1, 'Informe o código').toUpperCase() })
