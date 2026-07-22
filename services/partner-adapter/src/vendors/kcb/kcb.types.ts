export interface KcbTokenResponse {
  access_token: string
  expires_in: number
  token_type?: string
  scope?: string
}

export interface KcbFundsTransferRequest {
  companyCode: string
  transactionType: string
  debitAccountNumber: string
  creditAccountNumber: string
  debitAmount: number
  paymentDetails: string
  transactionReference: string
  currency: string
  beneficiaryDetails: string
  beneficiaryBankCode?: string
}

export interface KcbFundsTransferResponse {
  statusCode?: string
  statusMessage?: string
  statusDescription?: string
  merchantID?: string | null
  retrievalRefNumber?: string | null
  transactionReference?: string
  [key: string]: unknown
}