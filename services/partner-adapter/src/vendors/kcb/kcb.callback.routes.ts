import type { FastifyPluginAsync } from 'fastify'
import { getPayoutByReference, updatePayout } from '../../modules/payouts/payouts.store.js'
import { kcbCallbackSchema } from './kcb.callback.schemas.js'
import type { Payout } from '../../modules/payouts/payout.types.js'
import { saveWebhookEvent } from '../../modules/webhook-events/webhook-event.store.js'

export const kcbCallbackRoutes: FastifyPluginAsync = async (app) => {
  app.post('/webhooks/kcb', async (request, reply) => {
    const result = kcbCallbackSchema.safeParse(request.body)

    if (!result.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid KCB callback payload',
          details: result.error.flatten()
        }
      })
    }

    const callback = result.data
    await saveWebhookEvent({
      source: 'KCB',
      eventType: 'funds-transfer-callback',
      externalEventId: callback.ftReference ?? callback.transactionReference,
      signatureVerified: false,
      payload: callback,
      handlingStatus: 'RECEIVED'
    })

    const payout = await getPayoutByReference(callback.transactionReference)

    if (!payout) {
      return reply.code(404).send({
        error: {
          code: 'PAYOUT_NOT_FOUND',
          message: 'No payout found for KCB transaction reference'
        }
      })
    }

    const payoutUpdates: Partial<Omit<Payout, 'id' | 'createdAt'>> = {
      status: callback.transactionStatus === 'SUCCESS' ? 'COMPLETED' : 'FAILED',
      partnerReference: callback.transactionReference
    }

    if (callback.transactionMessage) {
      payoutUpdates.failureReason = callback.transactionMessage
    }

    const updatedPayout = (await updatePayout(payout.id, payoutUpdates)) ?? payout

    await saveWebhookEvent({
      source: 'KCB',
      eventType: 'funds-transfer-callback',
      externalEventId: callback.ftReference ?? callback.transactionReference,
      partnerPayoutId: updatedPayout.id,
      paymentIntentId: updatedPayout.paymentId,
      signatureVerified: false,
      payload: callback,
      handlingStatus: updatedPayout.status === 'FAILED' ? 'FAILED' : 'HANDLED',
      failureReason: updatedPayout.failureReason
    })

    return {
      data: updatedPayout
    }
  })
}
