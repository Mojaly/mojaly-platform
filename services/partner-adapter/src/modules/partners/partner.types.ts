import type { Payout } from '../payouts/payout.types.js'

export interface PartnerPayoutResult {
  partnerReference: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  rawResponse?: unknown
  failureReason?: string
}

export interface PartnerAdapter {
  code: string
  createPayout(payout: Payout): Promise<PartnerPayoutResult>
}