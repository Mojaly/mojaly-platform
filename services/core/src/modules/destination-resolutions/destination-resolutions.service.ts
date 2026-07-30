import { randomUUID } from 'node:crypto'
import type { CreateDestinationResolutionInput } from './destination-resolutions.schemas.js'
import type {
  PaymentDestination,
  PaymentIntent
} from '../payment-intents/payment-intent.types.js'
import { savePaymentIntent } from '../payment-intents/payment-intent.store.js'
import {
  resolvePartnerRoute,
  type ResolvePartnerRouteInput
} from '../partner-routing/partner-routing.service.js'

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

export function createDestinationResolution(
  input: CreateDestinationResolutionInput
): PaymentIntent {
  const now = new Date().toISOString()
  const id = randomUUID()
  const route = resolvePartnerRoute(createRouteInput(input))

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