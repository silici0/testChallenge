import { z } from 'zod'

import { isEthString } from '@/shared/lib/money'

/** Valor em ETH como string decimal (ADR-0011). */
export const ethSchema = z.string().refine(isEthString, { message: 'Valor ETH inválido' })

export const networkSchema = z.enum(['ethereum', 'polygon', 'solana'])
export type Network = z.infer<typeof networkSchema>

export const isoDateSchema = z.iso.datetime({ offset: true })

export const imageSchema = z.object({
  url: z.string(),
  alt: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
})
export type Image = z.infer<typeof imageSchema>

export const emailSchema = z.email({ message: 'Informe um e-mail válido' })

export const passwordSchema = z
  .string()
  .min(8, 'Mínimo de 8 caracteres')
  .regex(/[a-z]/, 'Inclua uma letra minúscula')
  .regex(/[A-Z]/, 'Inclua uma letra maiúscula')
  .regex(/\d/, 'Inclua um número')
  .regex(/[^A-Za-z0-9]/, 'Inclua um símbolo')

export const usernameSchema = z
  .string()
  .min(3, 'Mínimo de 3 caracteres')
  .max(30, 'Máximo de 30 caracteres')
  .regex(/^[a-z0-9._]+$/, 'Use letras minúsculas, números, ponto ou sublinhado')

export const quantitySchema = z.number().int().positive()

export const pageInfoSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
})
