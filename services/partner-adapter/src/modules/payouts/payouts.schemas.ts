import { z } from 'zod'

export const createPayoutSchema = z.object({
  paymentId: z.string().min(1),
  partnerCode: z.string().min(1),
  amount: z.string().regex(/^\d+$/),
  assetCode: z.string().min(3).max(10),
  assetScale: z.number().int().min(0),
  destinationType: z.enum(['bank_account', 'mobile_money']),
  destinationAccount: z.string().min(1),
  destinationBankCode: z.string().optional(),
  customerName: z.string().optional(),
  reference: z.string().min(1)
})

export type CreatePayoutInput = z.infer<typeof createPayoutSchema>