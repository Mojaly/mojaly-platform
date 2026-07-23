import type { PaymentIntent } from './payment-intent.types.js'

const paymentIntents = new Map<string, PaymentIntent>()

export function savePaymentIntent(intent: PaymentIntent): PaymentIntent {
  paymentIntents.set(intent.id, intent)
  return intent
}

export function getPaymentIntentById(id: string): PaymentIntent | undefined {
  return paymentIntents.get(id)
}

export function getPaymentIntentByWalletAddress(
  walletAddress: string
): PaymentIntent | undefined {
  return Array.from(paymentIntents.values()).find(
    (intent) => intent.walletAddress === walletAddress
  )
}

export function listPaymentIntents(): PaymentIntent[] {
  return Array.from(paymentIntents.values())
}

export function updatePaymentIntent(
  id: string,
  updates: Partial<Omit<PaymentIntent, 'id' | 'createdAt'>>
): PaymentIntent | undefined {
  const existing = paymentIntents.get(id)

  if (!existing) {
    return undefined
  }

  const updated: PaymentIntent = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  }

  paymentIntents.set(id, updated)
  return updated
}