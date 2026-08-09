import { createPartnerPayout } from '../../clients/partner-adapter.client.js'
import {
  getPaymentIntentById,
  updatePaymentIntent
} from '../payment-intents/payment-intent.store.js'
import type {
  PaymentAmount,
  PaymentIntentStatus
} from '../payment-intents/payment-intent.types.js'

export interface PartnerPayoutStatusInput {
  paymentIntentId: string
  adapterPayoutId: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  failureReason?: string
}

export async function handleFundingConfirmed(paymentReference: string) {
  const intent = await getPaymentIntentById(paymentReference)

  if (!intent) {
    return {
      handled: false,
      reason: 'Payment intent not found for payment reference'
    }
  }

  if (isFundingAlreadyConfirmed(intent.status)) {
    return {
      handled: true,
      paymentIntentId: intent.id,
      status: intent.status,
      reason: 'Payment intent funding was already confirmed'
    }
  }

  const fundedIntent = await updatePaymentIntent(intent.id, {
    status: 'FUNDED'
  })

  if (!fundedIntent) {
    return {
      handled: false,
      reason: 'Payment intent could not be updated'
    }
  }

  return {
    handled: true,
    paymentIntentId: fundedIntent.id,
    status: fundedIntent.status
  }
}

export async function handleInterledgerPaymentCompleted(
  paymentReference: string,
  payoutAmount?: PaymentAmount
) {
  const intent = await getPaymentIntentById(paymentReference)

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
      adapterPayoutId: intent.adapterPayoutId,
      reason: 'Partner payout already processed'
    }
  }

  try {
    const payoutResponse = await createPartnerPayout(intent, payoutAmount)
    const adapterPayoutId = extractAdapterPayoutId(payoutResponse)
    const adapterStatus = extractAdapterPayoutStatus(payoutResponse)
    const failureReason = extractAdapterFailureReason(payoutResponse)

    if (adapterStatus === 'FAILED') {
      const failedPayload: {
        status: 'FAILED'
        adapterPayoutId?: string
        failureReason?: string
      } = {
        status: 'FAILED'
      }

      if (adapterPayoutId) {
        failedPayload.adapterPayoutId = adapterPayoutId
      }

      if (failureReason) {
        failedPayload.failureReason = failureReason
      }

      const failedIntent = await updatePaymentIntent(intent.id, failedPayload)

      return {
        handled: true,
        paymentIntentId: failedIntent?.id ?? intent.id,
        status: failedIntent?.status ?? 'FAILED',
        adapterPayoutId,
        reason: failureReason ?? 'Partner payout failed'
      }
    }

    const status = adapterStatus === 'COMPLETED' ? 'COMPLETED' : 'PAYOUT_SUBMITTED'
    const updatePayload: {
      status: 'COMPLETED' | 'PAYOUT_SUBMITTED'
      adapterPayoutId?: string
    } = {
      status
    }

    if (adapterPayoutId) {
      updatePayload.adapterPayoutId = adapterPayoutId
    }

    const updatedIntent = await updatePaymentIntent(intent.id, updatePayload)

    return {
      handled: true,
      paymentIntentId: updatedIntent?.id ?? intent.id,
      status: updatedIntent?.status ?? status,
      adapterPayoutId
    }
  } catch (error) {
    const failedIntent = await updatePaymentIntent(intent.id, {
      status: 'FAILED',
      failureReason:
        error instanceof Error ? error.message : 'Partner payout failed'
    })

    return {
      handled: false,
      paymentIntentId: failedIntent?.id ?? intent.id,
      status: failedIntent?.status ?? 'FAILED',
      reason: 'Partner payout failed'
    }
  }
}

export async function retryPartnerPayout(paymentIntentId: string) {
  const intent = await getPaymentIntentById(paymentIntentId)

  if (!intent) {
    return {
      handled: false,
      reason: 'Payment intent not found'
    }
  }

  if (intent.status !== 'FAILED') {
    return {
      handled: false,
      paymentIntentId: intent.id,
      status: intent.status,
      reason: 'Only failed payment intents can retry partner payout'
    }
  }

  try {
    const payoutResponse = await createPartnerPayout(intent)
    const adapterPayoutId = extractAdapterPayoutId(payoutResponse)
    const adapterStatus = extractAdapterPayoutStatus(payoutResponse)
    const failureReason = extractAdapterFailureReason(payoutResponse)

    if (adapterStatus === 'FAILED') {
      const failedPayload: {
        status: 'FAILED'
        adapterPayoutId?: string
        failureReason?: string
      } = {
        status: 'FAILED'
      }

      if (adapterPayoutId) {
        failedPayload.adapterPayoutId = adapterPayoutId
      }

      if (failureReason) {
        failedPayload.failureReason = failureReason
      }

      const failedIntent = await updatePaymentIntent(intent.id, failedPayload)

      return {
        handled: true,
        paymentIntentId: failedIntent?.id ?? intent.id,
        status: failedIntent?.status ?? 'FAILED',
        adapterPayoutId,
        reason: failureReason ?? 'Partner payout retry failed'
      }
    }

    const status = adapterStatus === 'COMPLETED' ? 'COMPLETED' : 'PAYOUT_SUBMITTED'
    const updatePayload: {
      status: 'COMPLETED' | 'PAYOUT_SUBMITTED'
      adapterPayoutId?: string
    } = {
      status,
    }

    if (adapterPayoutId) {
      updatePayload.adapterPayoutId = adapterPayoutId
    }

    const updatedIntent = await updatePaymentIntent(intent.id, updatePayload)

    return {
      handled: true,
      paymentIntentId: updatedIntent?.id ?? intent.id,
      status: updatedIntent?.status ?? status,
      adapterPayoutId
    }
  } catch (error) {
    const failedIntent = await updatePaymentIntent(intent.id, {
      status: 'FAILED',
      failureReason:
        error instanceof Error ? error.message : 'Partner payout retry failed'
    })

    return {
      handled: false,
      paymentIntentId: failedIntent?.id ?? intent.id,
      status: failedIntent?.status ?? 'FAILED',
      reason: 'Partner payout retry failed'
    }
  }
}

export async function handlePartnerPayoutStatus(input: PartnerPayoutStatusInput) {
  const intent = await getPaymentIntentById(input.paymentIntentId)

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
    const completedIntent = await updatePaymentIntent(intent.id, {
      status: 'COMPLETED'
    })

    return {
      handled: true,
      paymentIntentId: completedIntent?.id ?? intent.id,
      status: completedIntent?.status ?? 'COMPLETED'
    }
  }

  const failedIntent = await updatePaymentIntent(intent.id, {
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

function isFundingAlreadyConfirmed(status: PaymentIntentStatus) {
  return (
    status === 'FUNDED' ||
    status === 'PAYOUT_SUBMITTED' ||
    status === 'COMPLETED' ||
    status === 'FAILED'
  )
}

function isTerminalOrSubmitted(status: PaymentIntentStatus) {
  return (
    status === 'PAYOUT_SUBMITTED' ||
    status === 'COMPLETED' ||
    status === 'FAILED'
  )
}

function extractAdapterPayoutId(response: unknown) {
  const data = extractAdapterResponseData(response)

  if (data && 'id' in data && typeof data.id === 'string') {
    return data.id
  }

  return undefined
}

function extractAdapterPayoutStatus(response: unknown) {
  const data = extractAdapterResponseData(response)

  if (data && 'status' in data && typeof data.status === 'string') {
    return data.status
  }

  return undefined
}

function extractAdapterFailureReason(response: unknown) {
  const data = extractAdapterResponseData(response)

  if (
    data &&
    'failureReason' in data &&
    typeof data.failureReason === 'string'
  ) {
    return data.failureReason
  }

  return undefined
}

function extractAdapterResponseData(response: unknown): Record<string, unknown> | undefined {
  if (
    response &&
    typeof response === 'object' &&
    'data' in response &&
    response.data &&
    typeof response.data === 'object'
  ) {
    return response.data as Record<string, unknown>
  }

  return undefined
}
