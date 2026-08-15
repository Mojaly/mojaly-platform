import { findAccountForFintechPartnerAsset } from '../account/account.store.js'
import { getAccountBalance } from '../account/account.service.js'
import {
  handleFundingConfirmed,
  handleInterledgerPaymentCompleted
} from '../payment-processing/payment-processing.service.js'
import { getPaymentIntentById } from '../payment-intents/payment-intent.store.js'
import { findTransactionByPaymentId } from '../transaction/transaction.store.js'
import { createTransaction, updateTransactionStatus } from '../transaction/transaction.service.js'
import type { RafikiClient } from './rafiki-client.js'
import { EventType } from './rafiki.types.js'
import type { WebhookType } from './validation.js'

type RafikiAmount = {
  value: number
  assetCode: string
  assetScale: number
}

type RafikiPaymentMetadata = {
  paymentReference?: string | undefined
  description?: string | undefined
}

type IncomingPaymentCompletedData = {
  id: string
  walletAddressId: string
  receivedAmount: RafikiAmount
  metadata?: RafikiPaymentMetadata | undefined
}

type OutgoingPaymentCreatedData = {
  id: string
  walletAddressId: string
  receiver: string
  debitAmount: RafikiAmount
  metadata?: RafikiPaymentMetadata | undefined
}

type OutgoingPaymentCompletedData = {
  id: string
  balance: string
  debitAmount: RafikiAmount
  sentAmount: RafikiAmount
  metadata?: RafikiPaymentMetadata | undefined
}

type OutgoingPaymentFailedData = {
  id: string
  balance: string
  debitAmount: RafikiAmount
  sentAmount: RafikiAmount
  error?: string | undefined
  metadata?: RafikiPaymentMetadata | undefined
}

export async function handleRafikiWebhook(
  event: WebhookType,
  rafikiClient: RafikiClient
) {
  switch (event.type) {
    case EventType.IncomingPaymentCompleted:
      return await handleIncomingPaymentCompleted(
        event.data as IncomingPaymentCompletedData
      )
    case EventType.OutgoingPaymentCreated:
      return await handleOutgoingPaymentCreated(
        event.id,
        event.data as OutgoingPaymentCreatedData,
        rafikiClient
      )
    case EventType.OutgoingPaymentCompleted:
      return await handleOutgoingPaymentCompleted(
        event.id,
        event.data as OutgoingPaymentCompletedData,
        rafikiClient
      )
    case EventType.OutgoingPaymentFailed:
      return await handleOutgoingPaymentFailed(
        event.id,
        event.data as OutgoingPaymentFailedData,
        rafikiClient
      )
    case EventType.IncomingPaymentCreated:
    case EventType.IncomingPaymentExpired:
    case EventType.WalletAddressNotFound:
      return {
        handled: false,
        reason: `Ignored Rafiki event type: ${event.type}`
      }
  }
}

async function handleIncomingPaymentCompleted(data: IncomingPaymentCompletedData) {
  const paymentReference = getPaymentReference(data.metadata)

  if (!paymentReference) {
    return {
      handled: false,
      reason: 'Missing payment reference in Rafiki webhook metadata'
    }
  }

  const intent = await getPaymentIntentById(paymentReference)

  if (!intent) {
    return {
      handled: false,
      reason: 'Payment intent not found for payment reference'
    }
  }

  const account = await findAccountForFintechPartnerAsset({
    fintechId: intent.fintechId,
    partnerCode: intent.partnerCode,
    assetCode: data.receivedAmount.assetCode,
    assetScale: data.receivedAmount.assetScale
  })

  if (!account) {
    return {
      handled: false,
      paymentIntentId: intent.id,
      reason: 'No active fintech account found for received asset and partner'
    }
  }

  const transaction = await createTransaction({
    paymentId: data.id,
    accountId: account.id,
    walletAddressId: data.walletAddressId,
    paymentIntentId: intent.id,
    assetCode: data.receivedAmount.assetCode,
    assetScale: data.receivedAmount.assetScale,
    value: String(data.receivedAmount.value),
    type: 'INCOMING',
    status: 'COMPLETED',
    source: 'INTERLEDGER',
    description: data.metadata?.description ?? 'Rafiki incoming payment completed'
  })

  const fundingResult = await handleFundingConfirmed(paymentReference)
  const partnerPayoutResult = await handleInterledgerPaymentCompleted(
    paymentReference,
    {
      value: String(data.receivedAmount.value),
      assetCode: data.receivedAmount.assetCode,
      assetScale: data.receivedAmount.assetScale
    }
  )

  return {
    ...fundingResult,
    partnerPayout: partnerPayoutResult,
    transactionId: transaction.id,
    accountId: account.id
  }
}

async function handleOutgoingPaymentCreated(
  eventId: string,
  data: OutgoingPaymentCreatedData,
  rafikiClient: RafikiClient
) {
  const paymentReference = getPaymentReference(data.metadata)

  if (!paymentReference) {
    return {
      handled: false,
      reason: 'Missing payment reference in Rafiki webhook metadata'
    }
  }

  const intent = await getPaymentIntentById(paymentReference)

  if (!intent) {
    await rafikiClient.cancelOutgoingPayment({
      id: data.id,
      reason: 'Payment intent not found for payment reference'
    })

    return {
      handled: true,
      reason: 'Cancelled Rafiki outgoing payment because payment intent was not found'
    }
  }

  const account = await findAccountForFintechPartnerAsset({
    fintechId: intent.fintechId,
    partnerCode: intent.partnerCode,
    assetCode: data.debitAmount.assetCode,
    assetScale: data.debitAmount.assetScale
  })

  if (!account) {
    await rafikiClient.cancelOutgoingPayment({
      id: data.id,
      reason: 'No active fintech account found for outgoing payment'
    })

    return {
      handled: true,
      paymentIntentId: intent.id,
      reason: 'Cancelled Rafiki outgoing payment because account was not found'
    }
  }

  const transaction = await createTransaction({
    paymentId: data.id,
    accountId: account.id,
    walletAddressId: data.walletAddressId,
    paymentIntentId: intent.id,
    assetCode: data.debitAmount.assetCode,
    assetScale: data.debitAmount.assetScale,
    value: String(data.debitAmount.value),
    type: 'OUTGOING',
    status: 'PENDING',
    source: 'INTERLEDGER',
    description: data.metadata?.description ?? 'Rafiki outgoing payment created'
  })

  const balanceResult = await getAccountBalance(account.id)
  const available = extractAvailableBalance(balanceResult.balance)
  const required = String(data.debitAmount.value)

  if (BigInt(available) < BigInt(required)) {
    await rafikiClient.cancelOutgoingPayment({
      id: data.id,
      reason: 'Insufficient funds'
    })

    await updateTransactionStatus(transaction.id, {
      status: 'FAILED',
      description: 'Cancelled because partner-backed balance was insufficient'
    })

    return {
      handled: true,
      paymentIntentId: intent.id,
      transactionId: transaction.id,
      accountId: account.id,
      status: 'FAILED',
      reason: 'Insufficient funds',
      available,
      required
    }
  }

  await rafikiClient.depositOutgoingPaymentLiquidity(data.id)

  return {
    handled: true,
    paymentIntentId: intent.id,
    transactionId: transaction.id,
    accountId: account.id,
    status: 'PENDING',
    liquidity: 'DEPOSITED',
    available,
    required
  }
}


async function handleOutgoingPaymentCompleted(
  eventId: string,
  data: OutgoingPaymentCompletedData,
  rafikiClient: RafikiClient
) {
  const transaction = await findTransactionByPaymentId(data.id)

  if (!transaction) {
    return {
      handled: false,
      paymentId: data.id,
      reason: 'Transaction not found for completed Rafiki outgoing payment'
    }
  }

  const paymentReference =
    getPaymentReference(data.metadata) ?? transaction.paymentIntentId

  if (!paymentReference) {
    return {
      handled: false,
      paymentId: data.id,
      transactionId: transaction.id,
      reason: 'Payment reference not found for completed Rafiki outgoing payment'
    }
  }

  const partnerPayoutResult = await handleInterledgerPaymentCompleted(
    paymentReference
  )

  if (data.balance !== '0') {
    await rafikiClient.withdrawLiqudity(eventId)
  }

  const adapterPayoutId = extractStringField(
    partnerPayoutResult,
    'adapterPayoutId'
  )
  const partnerStatus = extractStringField(partnerPayoutResult, 'status')
  const transactionStatus = mapPartnerStatusToTransactionStatus(partnerStatus)

  const transactionUpdates: Parameters<typeof updateTransactionStatus>[1] = {
    status: transactionStatus,
    description:
      data.metadata?.description ?? 'Rafiki outgoing payment completed'
  }

  if (adapterPayoutId) {
    transactionUpdates.partnerReference = adapterPayoutId
  }

  const updatedTransaction = await updateTransactionStatus(
    transaction.id,
    transactionUpdates
  )

  return {
    handled: true,
    paymentId: data.id,
    transactionId: transaction.id,
    status: updatedTransaction?.status ?? transactionStatus,
    partnerPayout: partnerPayoutResult,
    liquidity: data.balance !== '0' ? 'WITHDRAWN' : 'NONE_REMAINING'
  }
}

async function handleOutgoingPaymentFailed(
  eventId: string,
  data: OutgoingPaymentFailedData,
  rafikiClient: RafikiClient
) {
  const transaction = await findTransactionByPaymentId(data.id)

  if (!transaction) {
    return {
      handled: false,
      paymentId: data.id,
      reason: 'Transaction not found for failed Rafiki outgoing payment'
    }
  }

  const sentValue = BigInt(String(data.sentAmount.value))
  const paymentReference =
    getPaymentReference(data.metadata) ?? transaction.paymentIntentId
  let partnerPayoutResult: unknown

  if (sentValue > 0n && paymentReference) {
    partnerPayoutResult = await handleInterledgerPaymentCompleted(
      paymentReference,
      {
        value: String(data.sentAmount.value),
        assetCode: data.sentAmount.assetCode,
        assetScale: data.sentAmount.assetScale
      }
    )
  }

  if (data.balance !== '0') {
    await rafikiClient.withdrawLiqudity(eventId)
  }

  const adapterPayoutId = extractStringField(
    partnerPayoutResult,
    'adapterPayoutId'
  )
  const partnerStatus = extractStringField(partnerPayoutResult, 'status')
  const status = sentValue > 0n
    ? mapPartnerStatusToTransactionStatus(partnerStatus)
    : 'FAILED'
  const description = sentValue > 0n
    ? 'Rafiki outgoing payment failed after sending a partial amount'
    : data.error ?? data.metadata?.description ?? 'Rafiki outgoing payment failed'

  const transactionUpdates: Parameters<typeof updateTransactionStatus>[1] = {
    status,
    description
  }

  if (adapterPayoutId) {
    transactionUpdates.partnerReference = adapterPayoutId
  }

  const updatedTransaction = await updateTransactionStatus(
    transaction.id,
    transactionUpdates
  )

  return {
    handled: true,
    paymentId: data.id,
    transactionId: transaction.id,
    status: updatedTransaction?.status ?? status,
    sentAmount: String(data.sentAmount.value),
    partnerPayout: partnerPayoutResult,
    liquidity: data.balance !== '0' ? 'WITHDRAWN' : 'NONE_REMAINING'
  }
}

function getPaymentReference(metadata: RafikiPaymentMetadata | undefined) {
  if (typeof metadata?.paymentReference === 'string') {
    return metadata.paymentReference
  }

  return undefined
}

function extractAvailableBalance(balance: unknown): string {
  if (!balance || typeof balance !== 'object') {
    return '0'
  }

  const record = balance as Record<string, unknown>

  return typeof record.available === 'string' && /^\d+$/.test(record.available)
    ? record.available
    : '0'
}


function extractStringField(record: unknown, key: string): string | undefined {
  if (!record || typeof record !== 'object') {
    return undefined
  }

  const value = (record as Record<string, unknown>)[key]

  return typeof value === 'string' ? value : undefined
}

function mapPartnerStatusToTransactionStatus(
  status: string | undefined
): 'PENDING' | 'COMPLETED' | 'FAILED' {
  if (status === 'COMPLETED') {
    return 'COMPLETED'
  }

  if (status === 'FAILED') {
    return 'FAILED'
  }

  return 'PENDING'
}
