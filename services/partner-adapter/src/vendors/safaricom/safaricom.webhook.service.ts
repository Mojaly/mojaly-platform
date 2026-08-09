import axios from 'axios'
import { env } from '../../config/env.js'
import {
  getPayoutByPartnerReference,
  updatePayout
} from '../../modules/payouts/payouts.store.js'
import type { Payout } from '../../modules/payouts/payout.types.js'
import { mapSafaricomResultCode } from './safaricom.client.js'
import type { SafaricomB2cCallbackInput } from './safaricom.webhook.schemas.js'

export async function handleSafaricomB2cResult(
  callback: SafaricomB2cCallbackInput
) {
  const partnerReference = callback.Result.OriginatorConversationID

  if (!partnerReference) {
    return {
      handled: false,
      reason: 'OriginatorConversationID missing from Safaricom callback'
    }
  }

  const payout = await getPayoutByPartnerReference(partnerReference)

  if (!payout) {
    return {
      handled: false,
      reason: 'No payout found for Safaricom conversation',
      partnerReference
    }
  }

  const updates: Partial<Omit<Payout, 'id' | 'createdAt'>> = {
    partnerReference,
    status: mapSafaricomResultCode(callback.Result.ResultCode)
  }

  if (callback.Result.ResultCode !== 0) {
    updates.failureReason = callback.Result.ResultDesc
  }

  const updatedPayout = (await updatePayout(payout.id, updates)) ?? payout

  await notifyCore(updatedPayout)

  return {
    handled: true,
    payoutId: updatedPayout.id,
    paymentIntentId: updatedPayout.paymentId,
    status: updatedPayout.status
  }
}

export async function handleSafaricomTimeout(callback: unknown) {
  return {
    handled: true,
    status: 'PENDING',
    reason: 'Safaricom timeout callback received; transaction status query should reconcile final state',
    callback
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
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.PARTNER_ADAPTER_INTERNAL_API_KEY}`
      },
      timeout: 10_000
    }
  )
}

