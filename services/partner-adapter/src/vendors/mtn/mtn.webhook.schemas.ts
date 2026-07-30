import { z } from 'zod'

export const mtnTransferCallbackSchema = z.object({
  amount: z.string().optional(),
  currency: z.string().optional(),
  financialTransactionId: z.string().optional(),
  externalId: z.string().optional(),
  payee: z
    .object({
      partyIdType: z.string().optional(),
      partyId: z.string().optional()
    })
    .optional(),
  payerMessage: z.string().optional(),
  payeeNote: z.string().optional(),
  status: z.enum(['PENDING', 'SUCCESSFUL', 'FAILED']),
  reason: z.string().optional()
})

export type MtnTransferCallback = z.infer<typeof mtnTransferCallbackSchema>
