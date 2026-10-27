import { z } from 'zod'

import { emailSchema, ethSchema, imageSchema, isoDateSchema, networkSchema } from './common'

export const orderStatusSchema = z.enum(['pending', 'confirmed', 'declined'])
export type OrderStatus = z.infer<typeof orderStatusSchema>

export const buyerSchema = z.object({
  displayName: z.string().trim().min(1, 'Informe o nome de exibição'),
  username: z.string().trim().min(1, 'Informe o nome de usuário'),
  email: emailSchema,
  referralCode: z.string().trim().nullable(),
  note: z.string().trim().max(500, 'Máximo de 500 caracteres').nullable(),
})
export type Buyer = z.infer<typeof buyerSchema>

export const createOrderBodySchema = z.object({
  quoteId: z.string(),
  walletId: z.string(),
  network: networkSchema,
  buyer: buyerSchema,
})
export type CreateOrderBody = z.infer<typeof createOrderBodySchema>

export const transactionSchema = z.object({ hash: z.string(), explorerUrl: z.string(), simulated: z.literal(true) })

export const receiptSchema = z.object({
  items: z.array(
    z.object({
      nftId: z.string(),
      editionId: z.string(),
      name: z.string(),
      tokenId: z.string(),
      editionLabel: z.string(),
      image: imageSchema,
      quantity: z.number().int().positive(),
      unitPriceEth: ethSchema,
      lineTotalEth: ethSchema,
    }),
  ),
  subtotalEth: ethSchema,
  discountEth: ethSchema,
  networkFeeEth: ethSchema,
  totalEth: ethSchema,
  coupon: z.string().nullable(),
  network: networkSchema,
  walletAddress: z.string(),
})
export type Receipt = z.infer<typeof receiptSchema>

export const orderSchema = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  status: orderStatusSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
  declineReason: z.string().nullable(),
  receipt: receiptSchema,
  transaction: transactionSchema.nullable(),
})
export type Order = z.infer<typeof orderSchema>

export const ordersResponseSchema = z.object({ items: z.array(orderSchema) })
