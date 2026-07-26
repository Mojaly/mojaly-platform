import { handleFundingConfirmed } from '../payment-processing/payment-processing.service.js'
import type {
  RafikiIncomingPaymentCompletedData,
  RafikiWebhookEvent
} from './rafiki-webhooks.types.js'

export async function handleRafikiWebhook(event: RafikiWebhookEvent) {
  if (event.type !== 'incoming_payment.completed') {
    return {
      handled: false,
      reason: `Ignored Rafiki event type: ${event.type}`
    }
  }

  const paymentReference = getPaymentReference(
    event.data as unknown as RafikiIncomingPaymentCompletedData
  )

  if (!paymentReference) {
    return {
      handled: false,
      reason: 'Missing payment reference in Rafiki webhook metadata'
    }
  }

  return await handleFundingConfirmed(paymentReference)
}

function getPaymentReference(data: RafikiIncomingPaymentCompletedData) {
  const metadataReference = data.metadata?.paymentReference

  if (typeof metadataReference === 'string') {
    return metadataReference
  }

  return undefined
}
