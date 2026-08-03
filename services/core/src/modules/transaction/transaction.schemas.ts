import { z } from 'zod'

export const transactionTypeSchema = z.enum(['INCOMING', 'OUTGOING'])
export const transactionStatusSchema = z.enum([
  'PENDING',
  'COMPLETED',
  'EXPIRED',
  'FAILED'
])
export const transactionSourceSchema = z.enum(['INTERLEDGER', 'PARTNER'])

export const createTransactionSchema = z.object({
  paymentId: z.string().min(1),
  accountId: z.string().min(1),
  walletAddressId: z.string().min(1).optional(),
  paymentIntentId: z.string().min(1).optional(),
  assetCode: z.string().min(3).max(12),
  assetScale: z.coerce.number().int().min(0).max(18),
  value: z.string().min(1),
  type: transactionTypeSchema,
  status: transactionStatusSchema.optional(),
  source: transactionSourceSchema,
  description: z.string().min(1).max(240).optional(),
  partnerReference: z.string().min(1).optional()
})

export const transactionIdParamsSchema = z.object({
  id: z.string().min(1)
})

export const accountTransactionsParamsSchema = z.object({
  accountId: z.string().min(1)
})

export const updateTransactionStatusSchema = z.object({
  status: transactionStatusSchema,
  partnerReference: z.string().min(1).optional(),
  description: z.string().min(1).max(240).optional()
})
