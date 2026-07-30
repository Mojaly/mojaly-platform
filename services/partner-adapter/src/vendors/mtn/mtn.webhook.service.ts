import axios from 'axios'
import { env } from '../../config/env.js'
import {
  getPayoutByPartnerReference,
  updatePayout
} from '../../modules/payouts/payouts.store.js'
import type { Payout } from '../../modules/payouts/payout.types.js'
import { mapMtnStatus } from './mtn.client.js'
import type { MtnTransferCallback } from './mtn.webhook.schemas.js'

export async function handleMtnTransferCallback(
  referenceId: string,
  callback: MtnTransferCallback
) {
  const payout = getPayoutByPartnerReference(referenceId)

  if (!payout) {
    return {
      handled: false,
      reason: 'No payout found for MTN transfer reference',
      partnerReference: referenceId
    }
  }

  const updates: Partial<Omit<Payout, 'id' | 'createdAt'>> = {
    partnerReference: referenceId,
    status: mapMtnStatus(callback.status)
  }

  if (callback.reason) {
    updates.failureReason = callback.reason
  }

  const updatedPayout = updatePayout(payout.id, updates) ?? payout

  await notifyCore(updatedPayout)

  return {
    handled: true,
    payoutId: updatedPayout.id,
    paymentIntentId: updatedPayout.paymentId,
    status: updatedPayout.status
  }
}

async function notifyCore(payout: Payout): Promise<void> {
  await axios.post(
    `${env.MOJALY_CORE_URL}/partner-payouts/callback`,
    {
      paymentIntentId: payout.paymentId,
      adapterPayoutId: payout.id,
      status: payout.status,
      partnerReference: payout.partnerReference,
      failureReason: payout.failureReason
    },
    {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 10_000
    }
  )
}
