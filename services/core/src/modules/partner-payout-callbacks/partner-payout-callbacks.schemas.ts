import { z } from 'zod'

export const partnerPayoutCallbackSchema = z.object({
  paymentIntentId: z.string().min(1),
  adapterPayoutId: z.string().min(1),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED']),
  partnerReference: z.string().optional(),
  failureReason: z.string().optional()
})

export type PartnerPayoutCallbackInput = z.infer<
  typeof partnerPayoutCallbackSchema
>