import { z } from 'zod'

export const kcbCallbackSchema = z.object({
  ftReference: z.string().optional(),
  transactionDate: z.string().optional(),
  amount: z.string().optional(),
  transactionStatus: z.enum(['SUCCESS', 'FAILED']),
  transactionMessage: z.string().optional(),
  beneficiaryAccountNumber: z.string().optional(),
  beneficiaryName: z.string().optional(),
  transactionReference: z.string().min(1),
  merchantId: z.string().optional(),
  debitAccountNumber: z.string().optional()
})

export type KcbCallbackInput = z.infer<typeof kcbCallbackSchema>