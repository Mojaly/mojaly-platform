export type RafikiWebhookType =
  | 'incoming_payment.completed'
  | 'incoming_payment.expired'
  | 'incoming_payment.created'
  | 'incoming_payment.partial_payment_received'

export interface RafikiAmount {
  value: string
  assetCode: string
  assetScale: number
}

export interface RafikiIncomingPaymentCompletedData {
  id: string
  walletAddressId: string
  receivedAmount: RafikiAmount
  incomingAmount?: RafikiAmount
  metadata?: Record<string, unknown>
  completed: boolean
}

export interface RafikiWebhookEvent {
  id: string
  type: RafikiWebhookType
  data: Record<string, unknown>
}