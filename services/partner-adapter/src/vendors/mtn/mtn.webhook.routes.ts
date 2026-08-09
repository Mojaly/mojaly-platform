import type { FastifyPluginAsync } from 'fastify'
import { mtnTransferCallbackSchema } from './mtn.webhook.schemas.js'
import { handleMtnTransferCallback } from './mtn.webhook.service.js'
import { saveWebhookEvent } from '../../modules/webhook-events/webhook-event.store.js'

export const mtnWebhookRoutes: FastifyPluginAsync = async (app) => {
  app.post('/webhooks/mtn/transfers/:referenceId', async (request, reply) => {
    const params = request.params as { referenceId: string }
    const result = mtnTransferCallbackSchema.safeParse(request.body)

    if (!result.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid MTN transfer callback payload',
          details: result.error.flatten()
        }
      })
    }

    await saveWebhookEvent({
      source: 'MTN',
      eventType: 'transfer-callback',
      externalEventId: params.referenceId,
      signatureVerified: false,
      payload: result.data,
      handlingStatus: 'RECEIVED'
    })

    const callbackResult = await handleMtnTransferCallback(
      params.referenceId,
      result.data
    )

    await saveWebhookEvent({
      source: 'MTN',
      eventType: 'transfer-callback',
      externalEventId: params.referenceId,
      paymentIntentId: getStringField(callbackResult, 'paymentIntentId'),
      partnerPayoutId: getStringField(callbackResult, 'payoutId'),
      signatureVerified: false,
      payload: result.data,
      handlingStatus: getHandlingStatus(callbackResult),
      failureReason: getStringField(callbackResult, 'reason')
    })

    return reply.code(200).send({
      data: callbackResult
    })
  })
}

function getHandlingStatus(result: unknown) {
  if (!result || typeof result !== 'object') {
    return 'FAILED'
  }

  const record = result as Record<string, unknown>

  if (record.handled === true) {
    return 'HANDLED'
  }

  return 'FAILED'
}

function getStringField(record: unknown, key: string): string | undefined {
  if (!record || typeof record !== 'object') {
    return undefined
  }

  const value = (record as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : undefined
}
