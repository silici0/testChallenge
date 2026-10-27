import { z } from 'zod'

import { emailSchema, passwordSchema, usernameSchema } from './common'

export const ensNameSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9-]{3,}$/, 'Use letras minúsculas, números e hífen (mínimo 3), sem “.eth”')

export const profileSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  username: z.string(),
  email: z.string(),
  ensName: z.string().nullable(),
  walletNickname: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  version: z.number().int().positive(),
})
export type Profile = z.infer<typeof profileSchema>

export const updateProfileBodySchema = z.object({
  displayName: z.string().trim().min(1, 'Informe o nome de exibição').max(60),
  username: usernameSchema,
  email: emailSchema,
  ensName: ensNameSchema.nullable(),
  walletNickname: z.string().trim().max(40).nullable(),
})
export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>

export const changePasswordBodySchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((body) => body.newPassword === body.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem',
  })
export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
export const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const
