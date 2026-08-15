import { z } from 'zod'

export const createDestinationResolutionSchema = z.object({
  fintechId: z.string().min(1).optional(),

  destination: z.object({
    type: z.enum(['bank_account', 'mobile_money']),
    country: z.string().min(2).max(2),
    account: z.string().min(1),
    bankCode: z.string().optional(),
    network: z.string().optional(),
    name: z.string().optional()
  }),

  amount: z.object({
    value: z.string().regex(/^\d+$/),
    assetCode: z.string().min(3).max(10),
    assetScale: z.number().int().min(0)
  }),

  reference: z.string().min(1)
})

export type CreateDestinationResolutionInput = z.infer<
  typeof createDestinationResolutionSchema
>
