import axios from 'axios'
import { env } from '../../config/env.js'
import type {
  PartnerAdapter,
  PartnerPayoutResult
} from '../../modules/partners/partner.types.js'
import type { Payout } from '../../modules/payouts/payout.types.js'
import {
  getSafaricomAccessToken,
  requireSafaricomCredential
} from './safaricom.auth.js'
import type {
  SafaricomB2cResponse,
  SafaricomTransactionStatusResponse
} from './safaricom.types.js'

export class SafaricomClient implements PartnerAdapter {
  code = 'SAFARICOM_KE'

  async createPayout(payout: Payout): Promise<PartnerPayoutResult> {
    if (payout.destinationType !== 'mobile_money') {
      return {
        partnerReference: `SAFARICOM-${payout.id}`,
        status: 'FAILED',
        failureReason:
          'Safaricom B2C payouts require mobile_money destination type'
      }
    }

    const accessToken = await getSafaricomAccessToken()
    const response = await axios.post<SafaricomB2cResponse>(
      `${env.SAFARICOM_BASE_URL}/mpesa/b2c/v1/paymentrequest`,
      buildB2cRequestBody(payout),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      }
    )

    const partnerReference =
      response.data.OriginatorConversationID ??
      response.data.ConversationID ??
      `SAFARICOM-${payout.id}`

    if (response.data.ResponseCode === '0') {
      return {
        partnerReference,
        status: 'PENDING',
        rawResponse: response.data
      }
    }

    return {
      partnerReference,
      status: 'FAILED',
      rawResponse: response.data,
      failureReason:
        response.data.ResponseDescription ??
        response.data.errorMessage ??
        'Safaricom rejected B2C payout request'
    }
  }

  async getPayoutStatus(payout: Payout): Promise<PartnerPayoutResult> {
    const accessToken = await getSafaricomAccessToken()
    const partnerReference = requireSafaricomCredential(
      'partnerReference',
      payout.partnerReference
    )

    const response = await axios.post<SafaricomTransactionStatusResponse>(
      `${env.SAFARICOM_BASE_URL}/mpesa/transactionstatus/v1/query`,
      {
        Initiator: requireSafaricomCredential(
          'SAFARICOM_INITIATOR_NAME',
          env.SAFARICOM_INITIATOR_NAME
        ),
        SecurityCredential: requireSafaricomCredential(
          'SAFARICOM_SECURITY_CREDENTIAL',
          env.SAFARICOM_SECURITY_CREDENTIAL
        ),
        CommandID: 'TransactionStatusQuery',
        TransactionID: partnerReference,
        PartyA: requireSafaricomCredential(
          'SAFARICOM_SHORTCODE',
          env.SAFARICOM_SHORTCODE
        ),
        IdentifierType: '4',
        ResultURL: requireSafaricomCredential(
          'SAFARICOM_RESULT_URL',
          env.SAFARICOM_RESULT_URL
        ),
        QueueTimeOutURL: requireSafaricomCredential(
          'SAFARICOM_TIMEOUT_URL',
          env.SAFARICOM_TIMEOUT_URL
        ),
        Remarks: payout.reference,
        Occasion: payout.reference
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      }
    )

    const result: PartnerPayoutResult = {
      partnerReference,
      status: response.data.ResponseCode === '0' ? 'PENDING' : 'FAILED',
      rawResponse: response.data
    }

    if (response.data.ResponseCode !== '0') {
      result.failureReason =
        response.data.ResponseDescription ??
        response.data.errorMessage ??
        'Safaricom transaction status query failed'
    }

    return result
  }
}

export function mapSafaricomResultCode(code: number): PartnerPayoutResult['status'] {
  return code === 0 ? 'COMPLETED' : 'FAILED'
}

function buildB2cRequestBody(payout: Payout) {
  return {
    InitiatorName: requireSafaricomCredential(
      'SAFARICOM_INITIATOR_NAME',
      env.SAFARICOM_INITIATOR_NAME
    ),
    SecurityCredential: requireSafaricomCredential(
      'SAFARICOM_SECURITY_CREDENTIAL',
      env.SAFARICOM_SECURITY_CREDENTIAL
    ),
    CommandID: env.SAFARICOM_B2C_COMMAND_ID,
    Amount: amountToMajorNumber(payout.amount, payout.assetScale),
    PartyA: requireSafaricomCredential(
      'SAFARICOM_SHORTCODE',
      env.SAFARICOM_SHORTCODE
    ),
    PartyB: payout.destinationAccount,
    Remarks: payout.reference.slice(0, 100),
    QueueTimeOutURL: requireSafaricomCredential(
      'SAFARICOM_TIMEOUT_URL',
      env.SAFARICOM_TIMEOUT_URL
    ),
    ResultURL: requireSafaricomCredential(
      'SAFARICOM_RESULT_URL',
      env.SAFARICOM_RESULT_URL
    ),
    Occasion: payout.reference.slice(0, 100)
  }
}

function amountToMajorNumber(amount: string, assetScale: number): number {
  const minor = Number(amount)
  if (!Number.isSafeInteger(minor)) throw new Error('Invalid payout amount')
  return minor / 10 ** assetScale
}
