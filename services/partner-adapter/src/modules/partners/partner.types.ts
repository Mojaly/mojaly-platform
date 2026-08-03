import type { Payout } from '../payouts/payout.types.js'

export interface PartnerPayoutResult {
  partnerReference: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  rawResponse?: unknown
  failureReason?: string
}

export interface PartnerBalance {
  partnerCode: string
  externalAccountId: string
  assetCode: string
  assetScale: number
  available: string
  rawResponse?: unknown
}

export interface PartnerBalanceInput {
  externalAccountId: string
  assetCode: string
  assetScale: number
}

export interface PartnerAdapter {
  code: string
  createPayout(payout: Payout): Promise<PartnerPayoutResult>
  getPayoutStatus?(payout: Payout): Promise<PartnerPayoutResult>

  // Mojaly asks the selected partner for the fintech-backed account balance.
  getBalance?(input: PartnerBalanceInput): Promise<PartnerBalance>
}