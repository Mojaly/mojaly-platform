import { randomUUID } from 'node:crypto'
import { env } from '../../config/env.js'
import type { CreateDestinationResolutionInput } from './destination-resolutions.schemas.js'
import type {
  PaymentDestination,
  PaymentIntent
} from '../payment-intents/payment-intent.types.js'
import { savePaymentIntent } from '../payment-intents/payment-intent.store.js'

function selectPartnerCode(input: CreateDestinationResolutionInput): string {
  if (
    input.destination.country === 'GB' &&
    input.destination.type === 'bank_account'
  ) {
    return 'GRIFFIN'
  }

  if (
    input.destination.country === 'KE' &&
    input.destination.type === 'mobile_money'
  ) {
    return 'KCB'
  }

  if (
    input.destination.country === 'KE' &&
    input.destination.type === 'bank_account'
  ) {
    return 'KCB'
  }

  return 'UNKNOWN'
}

function createPartnerWalletAddress(partnerCode: string): string {
  const partnerPath = partnerCode.toLowerCase()

  return `${env.MOJALY_WALLET_ADDRESS_BASE_URL}/${partnerPath}`
}

function getExpiresAt(): string {
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + 30)
  return expiresAt.toISOString()
}

function createPaymentDestination(
  input: CreateDestinationResolutionInput
): PaymentDestination {
  const destination: PaymentDestination = {
    type: input.destination.type,
    country: input.destination.country,
    account: input.destination.account
  }

  if (input.destination.bankCode) {
    destination.bankCode = input.destination.bankCode
  }

  if (input.destination.network) {
    destination.network = input.destination.network
  }

  if (input.destination.name) {
    destination.name = input.destination.name
  }

  return destination
}

export function createDestinationResolution(
  input: CreateDestinationResolutionInput
): PaymentIntent {
  const now = new Date().toISOString()
  const id = randomUUID()
  const partnerCode = selectPartnerCode(input)

  const intent: PaymentIntent = {
    id,
    fintechId: input.fintechId,
    partnerCode,
    destination: createPaymentDestination(input),
    amount: input.amount,
    reference: input.reference,
    walletAddress: createPartnerWalletAddress(partnerCode),
    status: 'AWAITING_PAYMENT',
    createdAt: now,
    updatedAt: now,
    expiresAt: getExpiresAt()
  }

  return savePaymentIntent(intent)
}