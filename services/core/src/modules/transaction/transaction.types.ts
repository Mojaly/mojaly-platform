export type TransactionType = 'INCOMING' | 'OUTGOING'
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'FAILED'
export type TransactionSource = 'INTERLEDGER' | 'PARTNER'

export type Transaction = {
  id: string
  paymentId: string
  accountId: string
  walletAddressId?: string
  paymentIntentId?: string
  assetCode: string
  assetScale: number
  value: string
  type: TransactionType
  status: TransactionStatus
  source: TransactionSource
  description?: string
  partnerReference?: string
  createdAt: string
  updatedAt: string
}

export type CreateTransactionInput = {
  paymentId: string
  accountId: string
  walletAddressId?: string | undefined
  paymentIntentId?: string | undefined
  assetCode: string
  assetScale: number
  value: string
  type: TransactionType
  status?: TransactionStatus | undefined
  source: TransactionSource
  description?: string | undefined
  partnerReference?: string | undefined
}

export type UpdateTransactionStatusInput = {
  status: TransactionStatus
  partnerReference?: string | undefined
  description?: string | undefined
}
