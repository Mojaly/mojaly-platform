export interface MtnTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export type MtnTransferStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED'

export interface MtnTransferStatusResponse {
  amount?: string
  currency?: string
  financialTransactionId?: string
  externalId?: string
  payee?: {
    partyIdType?: string
    partyId?: string
  }
  payerMessage?: string
  payeeNote?: string
  status: MtnTransferStatus
  reason?: string
  [key: string]: unknown
}
