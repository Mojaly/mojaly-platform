import axios from 'axios'
import { env } from '../../config/env.js'
import type {
  PartnerAdapter,
  PartnerPayoutResult
} from '../../modules/partners/partner.types.js'
import type { Payout } from '../../modules/payouts/payout.types.js'
import { getKcbAccessToken } from './kcb.auth.js'
import { mapPayoutToKcbFundsTransfer } from './kcb.mapper.js'
import type { KcbFundsTransferResponse } from './kcb.types.js'

export class KcbClient implements PartnerAdapter {
  code = 'KCB'

  async createPayout(payout: Payout): Promise<PartnerPayoutResult> {
    const accessToken = await getKcbAccessToken()
    const requestBody = mapPayoutToKcbFundsTransfer(payout)

    const response = await axios.post<KcbFundsTransferResponse>(
      `${env.KCB_BASE_URL}/api/v1/transfer`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      }
    )

    const body = response.data
    const partnerReference = getPartnerReference(body, payout.id)

    if (body.statusCode === '0') {
      return {
        partnerReference,
        status: 'PENDING',
        rawResponse: body
      }
    }

    return {
      partnerReference,
      status: 'FAILED',
      rawResponse: body,
      failureReason:
        body.statusDescription ??
        body.statusMessage ??
        'KCB rejected funds transfer request'
    }
  }
}

function getPartnerReference(
  body: KcbFundsTransferResponse,
  fallbackId: string
): string {
  if (typeof body.retrievalRefNumber === 'string') {
    return body.retrievalRefNumber
  }

  if (typeof body.merchantID === 'string') {
    return body.merchantID
  }

  if (typeof body.transactionReference === 'string') {
    return body.transactionReference
  }

  return `KCB-${fallbackId}`
}