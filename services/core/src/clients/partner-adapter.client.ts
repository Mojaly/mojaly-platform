import axios from 'axios'
import { env } from '../config/env.js'
import type {
  PaymentAmount,
  PaymentIntent
} from '../modules/payment-intents/payment-intent.types.js'

export async function createPartnerPayout(
  intent: PaymentIntent,
  amountOverride?: PaymentAmount
) {
  const payload = buildPartnerPayoutPayload(intent, amountOverride)

  const response = await axios.post(`${env.PARTNER_ADAPTER_URL}/payouts`, payload, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    timeout: 10_000
  })

  return response.data
}

export async function getPartnerAccountBalance(input: {
  partnerCode: string
  externalAccountId: string
  assetCode: string
  assetScale: number
}) {
  const response = await axios.get(
    `${env.PARTNER_ADAPTER_URL}/partners/${input.partnerCode}/accounts/${input.externalAccountId}/balance`,
    {
      params: {
        assetCode: input.assetCode,
        assetScale: input.assetScale
      },
      headers: {
        Accept: 'application/json'
      },
      timeout: 10_000
    }
  )

  return response.data
}
function buildPartnerPayoutPayload(
  intent: PaymentIntent,
  amountOverride?: PaymentAmount
) {
  const amount = amountOverride ?? intent.amount

  const payload: {
    paymentId: string
    partnerCode: string
    amount: string
    assetCode: string
    assetScale: number
    destinationType: PaymentIntent['destination']['type']
    destinationAccount: string
    reference: string
    destinationBankCode?: string
    destinationNetwork?: string
    customerName?: string
  } = {
    paymentId: intent.id,
    partnerCode: intent.partnerCode,
    amount: amount.value,
    assetCode: amount.assetCode,
    assetScale: amount.assetScale,
    destinationType: intent.destination.type,
    destinationAccount: intent.destination.account,
    reference: intent.reference
  }

  if (intent.destination.bankCode) {
    payload.destinationBankCode = intent.destination.bankCode
  }

  if (intent.destination.network) {
    payload.destinationNetwork = intent.destination.network
  }

  if (intent.destination.name) {
    payload.customerName = intent.destination.name
  }

  return payload
}
