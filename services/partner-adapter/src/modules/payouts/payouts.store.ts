import type { Payout } from './payout.types.js'

const payouts = new Map<string, Payout>()

export function savePayout(payout: Payout): Payout {
  payouts.set(payout.id, payout)
  return payout
}

export function getPayoutById(id: string): Payout | undefined {
  return payouts.get(id)
}

export function listPayouts(): Payout[] {
  return Array.from(payouts.values())
}

export function updatePayout(
  id: string,
  updates: Partial<Omit<Payout, 'id' | 'createdAt'>>
): Payout | undefined {
  const existing = payouts.get(id)

  if (!existing) {
    return undefined
  }

  const updated: Payout = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  }

  payouts.set(id, updated)
  return updated
}

export function getPayoutByReference(reference: string): Payout | undefined {
  return Array.from(payouts.values()).find(
    (payout) => payout.reference === reference
  )
}

export function getPayoutByPartnerReference(
  partnerReference: string
): Payout | undefined {
  return Array.from(payouts.values()).find(
    (payout) => payout.partnerReference === partnerReference
  )
}
