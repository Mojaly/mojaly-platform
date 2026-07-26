import { handlePartnerPayoutStatus } from '../payment-processing/payment-processing.service.js'
import type { PartnerPayoutCallbackInput } from './partner-payout-callbacks.schemas.js'

export function handlePartnerPayoutCallback(input: PartnerPayoutCallbackInput) {
  const statusInput: {
    paymentIntentId: string
    adapterPayoutId: string
    status: PartnerPayoutCallbackInput['status']
    failureReason?: string
  } = {
    paymentIntentId: input.paymentIntentId,
    adapterPayoutId: input.adapterPayoutId,
    status: input.status
  }

  if (input.failureReason) {
    statusInput.failureReason = input.failureReason
  }

  return handlePartnerPayoutStatus(statusInput)
}
