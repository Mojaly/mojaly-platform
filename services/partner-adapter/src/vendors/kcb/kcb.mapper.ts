import { env } from '../../config/env.js'
import type { Payout } from '../../modules/payouts/payout.types.js'
import type { KcbFundsTransferRequest } from './kcb.types.js'

function requireKcbConfig(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing ${name}`)
  }

  return value
}

function amountToMajorUnits(amount: string, assetScale: number): number {
  const minorUnits = Number(amount)

  if (!Number.isSafeInteger(minorUnits)) {
    throw new Error('Invalid payout amount')
  }

  return minorUnits / 10 ** assetScale
}

export function mapPayoutToKcbFundsTransfer(
  payout: Payout
): KcbFundsTransferRequest {
  return {
    companyCode: requireKcbConfig('KCB_COMPANY_CODE', env.KCB_COMPANY_CODE),
    transactionType: requireKcbConfig(
      'KCB_TRANSACTION_TYPE',
      env.KCB_TRANSACTION_TYPE
    ),
    debitAccountNumber: requireKcbConfig(
      'KCB_DEBIT_ACCOUNT_NUMBER',
      env.KCB_DEBIT_ACCOUNT_NUMBER
    ),
    creditAccountNumber: payout.destinationAccount,
    debitAmount: amountToMajorUnits(payout.amount, payout.assetScale),
    paymentDetails: payout.reference,
    transactionReference: payout.reference,
    currency: payout.assetCode || env.KCB_CURRENCY,
    beneficiaryDetails: payout.customerName ?? payout.destinationAccount,
    ...(payout.destinationBankCode
      ? { beneficiaryBankCode: payout.destinationBankCode }
      : {})
  }
}