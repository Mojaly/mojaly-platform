export type PaymentIntentStatus =
  | 'CREATED'
  | 'AWAITING_PAYMENT'
  | 'FUNDED'
  | 'PAYOUT_SUBMITTED'
  | 'COMPLETED'
  | 'FAILED'
  | 'EXPIRED'

export type DestinationType = 'bank_account' | 'mobile_money'

export interface PaymentDestination {
  type: DestinationType
  country: string
  account: string
  bankCode?: string
  network?: string
  name?: string
}

export interface PaymentAmount {
  value: string
  assetCode: string
  assetScale: number
}

export interface PaymentIntent {
  id: string
  fintechId: string
  partnerCode: string
  destination: PaymentDestination
  amount: PaymentAmount
  reference: string
  walletAddress: string
  status: PaymentIntentStatus
  adapterPayoutId?: string
  failureReason?: string
  createdAt: string
  updatedAt: string
  expiresAt: string
}