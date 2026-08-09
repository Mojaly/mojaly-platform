import axios from 'axios'
import { env } from '../../config/env.js'
import {
  getPayoutByPartnerReference,
  updatePayout
} from '../../modules/payouts/payouts.store.js'
import type { Payout } from '../../modules/payouts/payout.types.js'
import { mapGriffinSubmissionStatus } from './griffin.client.js'
import type { GriffinWebhookEvent } from './griffin.webhook.schemas.js'

const processedEvents = new Set<string>()

export async function handleGriffinWebhookEvent(event: GriffinWebhookEvent) {
  if (processedEvents.has(event['event-url'])) {
    return {
      handled: true,
      duplicate: true,
      eventUrl: event['event-url']
    }
  }

  processedEvents.add(event['event-url'])

  if (!isSubmissionEvent(event['event-type'])) {
    return {
      handled: false,
      ignored: true,
      eventType: event['event-type']
    }
  }

  const submissionUrl = getString(event['event-payload']['submission-url'])

  if (!submissionUrl) {
    return {
      handled: false,
      reason: 'submission-url missing from Griffin event'
    }
  }

  const payout = await getPayoutByPartnerReference(submissionUrl)

  if (!payout) {
    return {
      handled: false,
      reason: 'No payout found for Griffin submission',
      partnerReference: submissionUrl
    }
  }

  const status = mapGriffinSubmissionStatus(
    event['event-payload']['submission-status']
  )
  const updates: Partial<Omit<Payout, 'id' | 'createdAt'>> = {
    status,
    partnerReference: submissionUrl
  }

  const failureReason = getString(
    event['event-payload']['submission-status-reason']
  )

  if (failureReason) {
    updates.failureReason = failureReason
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

function isSubmissionEvent(eventType: string): boolean {
  return eventType === 'submission-created' || eventType === 'submission-updated'
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
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

