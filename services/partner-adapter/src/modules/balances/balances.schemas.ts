import { z } from 'zod'

export const getBalanceParamsSchema = z.object({
  partnerCode: z.string().min(1),
  externalAccountId: z.string().min(1)
})

export const getBalanceQuerySchema = z.object({
  assetCode: z.string().min(3).max(12),
  assetScale: z.coerce.number().int().min(0).max(18)
})