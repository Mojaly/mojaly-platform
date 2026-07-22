export type PayoutStatus =
  | 'RECEIVED'
  | 'VALIDATED'
  | 'SUBMITTED_TO_PARTNER'
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'

export type DestinationType = 'bank_account' | 'mobile_money'

export interface Payout {
  id: string
  paymentId: string
  partnerCode: string
  amount: string
  assetCode: string
  assetScale: number
  destinationType: DestinationType
  destinationAccount: string
  destinationBankCode?: string
  customerName?: string
  reference: string
  status: PayoutStatus
  partnerReference?: string
  failureReason?: string
  createdAt: string
  updatedAt: string
}