import { z } from 'zod'

import { emailSchema, isoDateSchema, passwordSchema, usernameSchema } from './common'

export const userSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  username: z.string(),
  email: z.string(),
  avatarUrl: z.string().nullable(),
})
export type User = z.infer<typeof userSchema>

export const sessionSchema = z.object({ token: z.string(), expiresAt: isoDateSchema })

export const authResponseSchema = z.object({ user: userSchema, session: sessionSchema })
export type AuthResponse = z.infer<typeof authResponseSchema>

export const loginBodySchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe a senha'),
  guestCartId: z.string().optional(),
})
export type LoginBody = z.infer<typeof loginBodySchema>

export const registerBodySchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    guestCartId: z.string().optional(),
  })
  .refine((body) => body.password === body.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem',
  })
export type RegisterBody = z.infer<typeof registerBodySchema>
