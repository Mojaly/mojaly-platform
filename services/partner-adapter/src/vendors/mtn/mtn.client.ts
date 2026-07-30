import axios from 'axios'
import { randomUUID } from 'node:crypto'
import { env } from '../../config/env.js'
import type {
  PartnerAdapter,
  PartnerPayoutResult
} from '../../modules/partners/partner.types.js'
import type { Payout } from '../../modules/payouts/payout.types.js'
import { getMtnAccessToken } from './mtn.auth.js'
import type { MtnTransferStatusResponse } from './mtn.types.js'

export class MtnClient implements PartnerAdapter {
  code = 'MTN_UG'

  async createPayout(payout: Payout): Promise<PartnerPayoutResult> {
    if (payout.destinationType !== 'mobile_money') {
      return {
        partnerReference: `MTN-${payout.id}`,
        status: 'FAILED',
        failureReason: 'MTN payouts require mobile_money destination type'
      }
    }

    const accessToken = await getMtnAccessToken()
    const subscriptionKey = requireMtnCredential(
      'MTN_SUBSCRIPTION_KEY',
      env.MTN_SUBSCRIPTION_KEY
    )
    const referenceId = randomUUID()
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      'Ocp-Apim-Subscription-Key': subscriptionKey,
      'X-Reference-Id': referenceId,
      'X-Target-Environment': env.MTN_TARGET_ENVIRONMENT,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }

    if (env.MTN_CALLBACK_URL) {
      headers['X-Callback-Url'] = env.MTN_CALLBACK_URL
    }

    await axios.post(
      `${env.MTN_BASE_URL}/disbursement/v1_0/transfer`,
      buildTransferBody(payout),
      {
        headers,
        validateStatus: (status) => status === 202
      }
    )

    return {
      partnerReference: referenceId,
      status: 'PENDING'
    }
  }

  async getPayoutStatus(payout: Payout): Promise<PartnerPayoutResult> {
    const partnerReference = requireMtnCredential(
      'partnerReference',
      payout.partnerReference
    )
    const accessToken = await getMtnAccessToken()
    const subscriptionKey = requireMtnCredential(
      'MTN_SUBSCRIPTION_KEY',
      env.MTN_SUBSCRIPTION_KEY
    )

    const response = await axios.get<MtnTransferStatusResponse>(
      `${env.MTN_BASE_URL}/disbursement/v1_0/transfer/${partnerReference}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Ocp-Apim-Subscription-Key': subscriptionKey,
          'X-Target-Environment': env.MTN_TARGET_ENVIRONMENT,
          Accept: 'application/json'
        }
      }
    )

    const result: PartnerPayoutResult = {
      partnerReference,
      status: mapMtnStatus(response.data.status),
      rawResponse: response.data
    }

    if (response.data.status === 'FAILED') {
      result.failureReason = response.data.reason ?? 'MTN transfer failed'
    }

    return result
  }
}

export function mapMtnStatus(
  status: MtnTransferStatusResponse['status'] | undefined
): PartnerPayoutResult['status'] {
  if (status === 'SUCCESSFUL') return 'COMPLETED'
  if (status === 'FAILED') return 'FAILED'
  return 'PENDING'
}

function buildTransferBody(payout: Payout) {
  return {
    amount: amountToMajorString(payout.amount, payout.assetScale),
    currency: payout.assetCode,
    externalId: payout.reference,
    payee: {
      partyIdType: 'MSISDN',
      partyId: payout.destinationAccount
    },
    payerMessage: payout.reference.slice(0, 160),
    payeeNote: payout.reference.slice(0, 160),
    ...(env.MTN_TRANSFER_TYPE ? { transferType: env.MTN_TRANSFER_TYPE } : {})
  }
}

function amountToMajorString(amount: string, assetScale: number): string {
  const minor = Number(amount)
  if (!Number.isSafeInteger(minor)) throw new Error('Invalid payout amount')
  return (minor / 10 ** assetScale).toFixed(assetScale)
}

function requireMtnCredential(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing ${name}`)
  return value
}
