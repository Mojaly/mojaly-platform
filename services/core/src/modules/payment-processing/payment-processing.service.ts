import { createPartnerPayout } from '../../clients/partner-adapter.client.js'
import {
  getPaymentIntentById,
  updatePaymentIntent
} from '../payment-intents/payment-intent.store.js'
import type { PaymentIntentStatus } from '../payment-intents/payment-intent.types.js'

export interface PartnerPayoutStatusInput {
  paymentIntentId: string
  adapterPayoutId: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  failureReason?: string
}

export async function handleFundingConfirmed(paymentReference: string) {
  const intent = getPaymentIntentById(paymentReference)

  if (!intent) {
    return {
      handled: false,
      reason: 'Payment intent not found for payment reference'
    }
  }

  if (isTerminalOrSubmitted(intent.status)) {
    return {
      handled: true,
      paymentIntentId: intent.id,
      status: intent.status,
      reason: 'Payment intent already processed'
    }
  }

  const fundedIntent = updatePaymentIntent(intent.id, {
    status: 'FUNDED'
  })

  if (!fundedIntent) {
    return {
      handled: false,
      reason: 'Payment intent could not be updated'
    }
  }

  try {
    const payoutResponse = await createPartnerPayout(fundedIntent)
    const adapterPayoutId = extractAdapterPayoutId(payoutResponse)

    const updatePayload: {
      status: 'PAYOUT_SUBMITTED'
      adapterPayoutId?: string
    } = {
      status: 'PAYOUT_SUBMITTED'
    }

    if (adapterPayoutId) {
      updatePayload.adapterPayoutId = adapterPayoutId
    }

    const payoutSubmittedIntent = updatePaymentIntent(
      fundedIntent.id,
      updatePayload
    )

    if (!payoutSubmittedIntent) {
      return {
        handled: false,
        reason: 'Payment intent payout was created but intent could not be updated'
      }
    }

    return {
      handled: true,
      paymentIntentId: payoutSubmittedIntent.id,
      status: payoutSubmittedIntent.status,
      adapterPayoutId
    }
  } catch (error) {
    const failedIntent = updatePaymentIntent(fundedIntent.id, {
      status: 'FAILED',
      failureReason:
        error instanceof Error ? error.message : 'Partner payout failed'
    })

    return {
      handled: false,
      paymentIntentId: failedIntent?.id ?? fundedIntent.id,
      status: failedIntent?.status ?? 'FAILED',
      reason: 'Partner payout failed'
    }
  }
}

export function handlePartnerPayoutStatus(input: PartnerPayoutStatusInput) {
  const intent = getPaymentIntentById(input.paymentIntentId)

  if (!intent) {
    return {
      handled: false,
      reason: 'Payment intent not found'
    }
  }

  if (
    intent.adapterPayoutId &&
    intent.adapterPayoutId !== input.adapterPayoutId
  ) {
    return {
      handled: false,
      paymentIntentId: intent.id,
      reason: 'Adapter payout id does not match payment intent'
    }
  }

  if (input.status === 'PENDING') {
    return {
      handled: true,
      paymentIntentId: intent.id,
      status: intent.status,
      reason: 'Partner payout is still pending'
    }
  }

  if (input.status === 'COMPLETED') {
    const completedIntent = updatePaymentIntent(intent.id, {
      status: 'COMPLETED'
    })

    return {
      handled: true,
      paymentIntentId: completedIntent?.id ?? intent.id,
      status: completedIntent?.status ?? 'COMPLETED'
    }
  }

  const failedIntent = updatePaymentIntent(intent.id, {
    status: 'FAILED',
    failureReason: input.failureReason ?? 'Partner payout failed'
  })

  return {
    handled: true,
    paymentIntentId: failedIntent?.id ?? intent.id,
    status: failedIntent?.status ?? 'FAILED',
    reason: input.failureReason ?? 'Partner payout failed'
  }
}

function isTerminalOrSubmitted(status: PaymentIntentStatus) {
  return (
    status === 'PAYOUT_SUBMITTED' ||
    status === 'COMPLETED' ||
    status === 'FAILED'
  )
}

function extractAdapterPayoutId(response: unknown) {
  if (
    response &&
    typeof response === 'object' &&
    'data' in response &&
    response.data &&
    typeof response.data === 'object' &&
    'id' in response.data &&
    typeof response.data.id === 'string'
  ) {
    return response.data.id
  }

  return undefined
}
