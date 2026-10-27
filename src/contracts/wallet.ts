import { z } from 'zod'

import { networkSchema } from './common'
import { ensNameSchema } from './profile'

export const walletProviderSchema = z.enum(['metamask', 'walletconnect', 'coinbase'])
export const walletRoleSchema = z.enum(['primary', 'secondary'])

const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/
const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

export const walletSchema = z.object({
  id: z.string(),
  role: walletRoleSchema,
  displayName: z.string(),
  nickname: z.string().nullable(),
  network: networkSchema,
  address: z.string(),
  provider: walletProviderSchema,
  ensName: z.string().nullable(),
  connection: z.enum(['disconnected', 'connected']),
  version: z.number().int().positive(),
})
export type Wallet = z.infer<typeof walletSchema>

export const walletInputSchema = z
  .object({
    role: walletRoleSchema,
    displayName: z.string().trim().min(1, 'Informe o nome de exibição').max(40),
    nickname: z.string().trim().max(40).nullable(),
    network: networkSchema,
    address: z.string().trim(),
    provider: walletProviderSchema,
    ensName: ensNameSchema.nullable(),
  })
  .superRefine((wallet, context) => {
    const valid = wallet.network === 'solana' ? SOLANA_ADDRESS.test(wallet.address) : EVM_ADDRESS.test(wallet.address)
    if (!valid) {
      const expected =
        wallet.network === 'solana'
          ? 'Endereço Solana (base58) inválido'
          : 'Endereço 0x inválido (0x + 40 hexadecimais)'
      context.addIssue({ code: 'custom', path: ['address'], message: expected })
    }
    if (wallet.ensName && wallet.network !== 'ethereum') {
      context.addIssue({ code: 'custom', path: ['ensName'], message: 'ENS só está disponível na rede Ethereum' })
    }
  })
export type WalletInput = z.infer<typeof walletInputSchema>

export const walletsResponseSchema = z.object({ items: z.array(walletSchema) })

export const connectWalletBodySchema = z.object({ network: networkSchema })
