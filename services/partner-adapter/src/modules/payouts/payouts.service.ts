import { randomUUID } from 'node:crypto'
import { getPartner } from '../partners/partner-registry.js'
import type { CreatePayoutInput } from './payouts.schemas.js'
import type { Payout } from './payout.types.js'
import {
  getPayoutById,
  listPayouts,
  savePayout,
  updatePayout
} from './payouts.store.js'

export async function createPayout(input: CreatePayoutInput): Promise<Payout> {
  const now = new Date().toISOString()

  const payout: Payout = {
    id: randomUUID(),
    paymentId: input.paymentId,
    partnerCode: input.partnerCode,
    amount: input.amount,
    assetCode: input.assetCode,
    assetScale: input.assetScale,
    destinationType: input.destinationType,
    destinationAccount: input.destinationAccount,
    reference: input.reference,
    status: 'RECEIVED',
    createdAt: now,
    updatedAt: now
  }

  if (input.destinationBankCode) {
    payout.destinationBankCode = input.destinationBankCode
  }

  if (input.customerName) {
    payout.customerName = input.customerName
  }

  await savePayout(payout)

  const partner = getPartner(input.partnerCode)

  if (!partner) {
    return (
      (await updatePayout(payout.id, {
        status: 'FAILED',
        failureReason: `Partner ${input.partnerCode} is not registered`
      })) ?? payout
    )
  }

  const submittedPayout =
    (await updatePayout(payout.id, {
      status: 'SUBMITTED_TO_PARTNER'
    })) ?? payout

  const partnerResult = await partner.createPayout(submittedPayout)

  const partnerUpdates: Partial<Omit<Payout, 'id' | 'createdAt'>> = {
    status: partnerResult.status,
    partnerReference: partnerResult.partnerReference
  }

  if (partnerResult.failureReason) {
    partnerUpdates.failureReason = partnerResult.failureReason
  }

  return (await updatePayout(payout.id, partnerUpdates)) ?? payout
}

export async function findPayout(id: string): Promise<Payout | undefined> {
  return getPayoutById(id)
}

export async function findPayouts(): Promise<Payout[]> {
  return listPayouts()
}

export async function refreshPayoutStatus(
  id: string
): Promise<Payout | undefined> {
  const payout = await getPayoutById(id)

  if (!payout) return undefined

  const partner = getPartner(payout.partnerCode)

  if (!partner?.getPayoutStatus) return payout

  const partnerResult = await partner.getPayoutStatus(payout)
  const updates: Partial<Omit<Payout, 'id' | 'createdAt'>> = {
    status: partnerResult.status,
    partnerReference: partnerResult.partnerReference
  }

  if (partnerResult.failureReason) {
    updates.failureReason = partnerResult.failureReason
  }

  return (await updatePayout(id, updates)) ?? payout
}
