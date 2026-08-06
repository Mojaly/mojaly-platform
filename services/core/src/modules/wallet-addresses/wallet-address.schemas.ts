import { z } from 'zod'

const walletAddressNameSchema = z
  .string()
  .trim()
  .min(3, 'Wallet address name must be at least 3 characters long')
  .max(120)
  .regex(/^[a-z1-9_-]+$/, {
    message:
      'Wallet address name can only contain lowercase letters, numbers 1-9, hyphens, and underscores'
  })
  .refine((value) => !value.startsWith('_'), {
    message: 'Wallet address name cannot start with an underscore'
  })
  .refine((value) => !value.endsWith('_'), {
    message: 'Wallet address name cannot end with an underscore'
  })
  .refine((value) => !value.startsWith('-'), {
    message: 'Wallet address name cannot start with a hyphen'
  })
  .refine((value) => !value.endsWith('-'), {
    message: 'Wallet address name cannot end with a hyphen'
  })

export const createWalletAddressBodySchema = z.object({
  walletAddressName: walletAddressNameSchema,
  publicName: z
    .string()
    .trim()
    .min(3, 'Public name must be at least 3 characters long')
    .max(120)
})

export const accountWalletAddressesParamsSchema = z.object({
  accountId: z.string().min(1)
})

export const workspaceAccountWalletAddressesParamsSchema = z.object({
  workspaceId: z.string().min(1),
  accountId: z.string().min(1)
})

export const walletAddressIdParamsSchema = z.object({
  id: z.string().min(1)
})

export const fintechWalletAddressesParamsSchema = z.object({
  fintechId: z.string().min(1)
})

export const workspaceWalletAddressesParamsSchema = z.object({
  workspaceId: z.string().min(1)
})
