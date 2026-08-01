import { z } from 'zod'

export const createDeveloperKeyParamsSchema = z.object({
  workspaceId: z.string().min(1),
  walletAddressId: z.string().min(1)
})

export const createDeveloperKeyBodySchema = z.object({
  name: z.string().min(1).max(80)
})

export const listDeveloperKeysParamsSchema = z.object({
  workspaceId: z.string().min(1)
})

export const listWalletDeveloperKeysParamsSchema = z.object({
  workspaceId: z.string().min(1),
  walletAddressId: z.string().min(1)
})

export const revokeDeveloperKeyParamsSchema = z.object({
  workspaceId: z.string().min(1),
  walletAddressId: z.string().min(1),
  keyId: z.string().min(1)
})
