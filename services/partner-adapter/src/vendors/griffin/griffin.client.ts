import axios from 'axios'
import { env } from '../../config/env.js'
import type {
  PartnerAdapter,
  PartnerPayoutResult
} from '../../modules/partners/partner.types.js'
import type { Payout } from '../../modules/payouts/payout.types.js'
import type {
  GriffinPayeeResponse,
  GriffinPaymentResponse,
  GriffinSubmissionResponse
} from './griffin.types.js'

function requireConfig(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function amountToMajorString(amount: string, assetScale: number): string {
  const minor = Number(amount)
  if (!Number.isSafeInteger(minor)) throw new Error('Invalid payout amount')
  return (minor / 10 ** assetScale).toFixed(assetScale)
}

export class GriffinClient implements PartnerAdapter {
  code = 'GRIFFIN'

  async createPayout(payout: Payout): Promise<PartnerPayoutResult> {
    try {
      const apiKey = requireConfig('GRIFFIN_API_KEY', env.GRIFFIN_API_KEY)
      const legalPersonId = requireConfig(
        'GRIFFIN_LEGAL_PERSON_ID',
        env.GRIFFIN_LEGAL_PERSON_ID
      )
      const bankAccountId = requireConfig(
        'GRIFFIN_BANK_ACCOUNT_ID',
        env.GRIFFIN_BANK_ACCOUNT_ID
      )

      const headers = {
        Authorization: `GriffinAPIKey ${apiKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }

      const payeeResponse = await axios.post<GriffinPayeeResponse>(
        `${env.GRIFFIN_BASE_URL}/v0/legal-persons/${legalPersonId}/bank/payees`,
        {
          'account-holder': payout.customerName ?? payout.destinationAccount,
          'account-number': payout.destinationAccount,
          'bank-id': requireConfig(
            'destinationBankCode',
            payout.destinationBankCode
          )
        },
        { headers }
      )

      const paymentResponse = await axios.post<GriffinPaymentResponse>(
        `${env.GRIFFIN_BASE_URL}/v0/bank/accounts/${bankAccountId}/payments`,
        {
          creditor: {
            'creditor-type': 'payee',
            'payee-url': payeeResponse.data['payee-url']
          },
          'payment-amount': {
            currency: payout.assetCode,
            value: amountToMajorString(payout.amount, payout.assetScale)
          },
          'payment-reference': payout.reference
        },
        { headers }
      )

      const paymentUrl = paymentResponse.data['payment-url']
      const submissionUrl =
        paymentResponse.data['payment-submissions-url'] ??
        `${paymentUrl}/submissions`

      const submissionResponse = await axios.post<GriffinSubmissionResponse>(
        buildGriffinUrl(submissionUrl),
        {
          'payment-scheme': env.GRIFFIN_PAYMENT_SCHEME
        },
        { headers }
      )

      const partnerReference =
        submissionResponse.data['submission-url'] ??
        submissionResponse.data['payment-submission-url'] ??
        paymentUrl

      return {
        partnerReference,
        status: mapGriffinSubmissionStatus(
          submissionResponse.data['submission-status']
        ),
        rawResponse: {
          payee: payeeResponse.data,
          payment: paymentResponse.data,
          submission: submissionResponse.data
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          partnerReference: `GRIFFIN-${payout.id}`,
          status: 'FAILED',
          rawResponse: {
            httpStatus: error.response?.status,
            data: error.response?.data
          },
          failureReason:
            `Griffin request failed with status ${error.response?.status ?? 'unknown'}`
        }
      }

      throw error
    }
  }

}

export function mapGriffinSubmissionStatus(
  status: unknown
): PartnerPayoutResult['status'] {
  if (
    status === 'accepted' ||
    status === 'completed' ||
    status === 'delivered'
  ) {
    return 'COMPLETED'
  }

  if (
    status === 'rejected' ||
    status === 'failed' ||
    status === 'cancelled' ||
    status === 'returned'
  ) {
    return 'FAILED'
  }

  return 'PENDING'
}

function buildGriffinUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl
  }

  return `${env.GRIFFIN_BASE_URL}${pathOrUrl}`
}
