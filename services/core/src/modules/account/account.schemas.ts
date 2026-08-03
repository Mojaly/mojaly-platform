import { z } from 'zod'

export const createAccountSchema = z.object({
  fintechId: z.string().min(1),
  name: z.string().min(1).max(120),
  partnerCode: z.string().min(1).max(40),
  externalPartnerAccountId: z.string().min(1),
  rafikiAssetId: z.string().min(1).optional(),
  assetCode: z.string().min(3).max(12),
  assetScale: z.coerce.number().int().min(0).max(18)
})

export const accountIdParamsSchema = z.object({
  id: z.string().min(1)
})

export const fintechAccountsParamsSchema = z.object({
  fintechId: z.string().min(1)
})
