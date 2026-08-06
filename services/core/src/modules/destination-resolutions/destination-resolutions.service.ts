import { randomUUID } from 'node:crypto'
import { findAccountForFintechPartnerAsset } from '../account/account.store.js'
import { getAccountBalance } from '../account/account.service.js'
import type { CreateDestinationResolutionInput } from './destination-resolutions.schemas.js'
import type {
  PaymentDestination,
  PaymentIntent
} from '../payment-intents/payment-intent.types.js'
import { savePaymentIntent } from '../payment-intents/payment-intent.store.js'
import {
  PartnerRouteNotFoundError,
  resolvePartnerRoute,
  type ResolvePartnerRouteInput
} from '../partner-routing/partner-routing.service.js'

export class FintechAccountNotFoundError extends Error {
  constructor() {
    super('No active fintech account found for this partner and asset')
    this.name = 'FintechAccountNotFoundError'
  }
}

export class InsufficientSpendCapacityError extends Error {
  constructor(
    public readonly available: string,
    public readonly required: string
  ) {
    super('Insufficient spend capacity')
    this.name = 'InsufficientSpendCapacityError'
  }
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

function createRouteInput(
  input: CreateDestinationResolutionInput
): ResolvePartnerRouteInput {
  const routeInput: ResolvePartnerRouteInput = {
    country: input.destination.country,
    destinationType: input.destination.type,
    assetCode: input.amount.assetCode
  }

  if (input.destination.network) {
    routeInput.network = input.destination.network
  }

  return routeInput
}

export async function createDestinationResolution(
  input: CreateDestinationResolutionInput
): Promise<PaymentIntent> {
  const now = new Date().toISOString()
  const id = randomUUID()
  const route = resolvePartnerRoute(createRouteInput(input))

  await assertSpendCapacity({
    fintechId: input.fintechId,
    partnerCode: route.partner.adapterCode,
    assetCode: input.amount.assetCode,
    assetScale: input.amount.assetScale,
    requiredAmount: input.amount.value
  })

  const intent: PaymentIntent = {
    id,
    fintechId: input.fintechId,
    partnerCode: route.partner.adapterCode,
    destination: createPaymentDestination(input),
    amount: input.amount,
    reference: input.reference,
    walletAddress: route.walletAddress.walletAddressUrl,
    status: 'AWAITING_PAYMENT',
    createdAt: now,
    updatedAt: now,
    expiresAt: getExpiresAt()
  }

  return savePaymentIntent(intent)
}

async function assertSpendCapacity(input: {
  fintechId: string
  partnerCode: string
  assetCode: string
  assetScale: number
  requiredAmount: string
}) {
  const account = await findAccountForFintechPartnerAsset({
    fintechId: input.fintechId,
    partnerCode: input.partnerCode,
    assetCode: input.assetCode,
    assetScale: input.assetScale
  })

  if (!account) {
    throw new FintechAccountNotFoundError()
  }

  // The partner is the source of truth for actual spend capacity.
  const balanceResult = await getAccountBalance(account.id)
  const available = extractAvailableBalance(balanceResult.balance)

  if (BigInt(available) < BigInt(input.requiredAmount)) {
    throw new InsufficientSpendCapacityError(available, input.requiredAmount)
  }
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

export function mapDestinationResolutionError(error: unknown) {
  if (error instanceof PartnerRouteNotFoundError) {
    return {
      statusCode: 404,
      code: 'PARTNER_ROUTE_NOT_FOUND',
      message: error.message
    }
  }

  if (error instanceof FintechAccountNotFoundError) {
    return {
      statusCode: 409,
      code: 'FINTECH_ACCOUNT_NOT_FOUND',
      message: error.message
    }
  }

  if (error instanceof InsufficientSpendCapacityError) {
    return {
      statusCode: 402,
      code: 'INSUFFICIENT_SPEND_CAPACITY',
      message: error.message,
      details: {
        available: error.available,
        required: error.required
      }
    }
  }

  return undefined
}

