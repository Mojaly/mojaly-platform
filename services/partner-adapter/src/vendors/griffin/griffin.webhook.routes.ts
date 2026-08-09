import type { FastifyPluginAsync } from 'fastify'
import { griffinWebhookEventSchema } from './griffin.webhook.schemas.js'
import { handleGriffinWebhookEvent } from './griffin.webhook.service.js'
import {
  GriffinWebhookSignatureError,
  verifyGriffinWebhookSignature
} from './griffin.webhook-signature.js'
import { saveWebhookEvent } from '../../modules/webhook-events/webhook-event.store.js'

export const griffinWebhookRoutes: FastifyPluginAsync = async (app) => {
  app.post('/webhooks/griffin', async (request, reply) => {
    try {
      await verifyGriffinWebhookSignature(request)
    } catch (error) {
      if (error instanceof GriffinWebhookSignatureError) {
        return reply.code(401).send({
          error: {
            code: 'INVALID_WEBHOOK_SIGNATURE',
            message: error.message
          }
        })
      }

      throw error
    }

    const result = griffinWebhookEventSchema.safeParse(request.body)

    if (!result.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid Griffin webhook payload',
          details: result.error.flatten()
        }
      })
    }

    await saveWebhookEvent({
      source: 'GRIFFIN',
      eventType: result.data['event-type'],
      externalEventId: result.data['event-url'],
      signatureVerified: true,
      payload: result.data,
      handlingStatus: 'RECEIVED'
    })

    const webhookResult = await handleGriffinWebhookEvent(result.data)

    await saveWebhookEvent({
      source: 'GRIFFIN',
      eventType: result.data['event-type'],
      externalEventId: result.data['event-url'],
      paymentIntentId: getStringField(webhookResult, 'paymentIntentId'),
      partnerPayoutId: getStringField(webhookResult, 'payoutId'),
      signatureVerified: true,
      payload: result.data,
      handlingStatus: getHandlingStatus(webhookResult),
      failureReason: getStringField(webhookResult, 'reason')
    })

    return reply.code(200).send({
      data: webhookResult
    })
  })
}

function getHandlingStatus(result: unknown) {
  if (!result || typeof result !== 'object') {
    return 'FAILED'
  }

  const record = result as Record<string, unknown>

  if (record.handled === true) {
    return record.ignored === true ? 'IGNORED' : 'HANDLED'
  }

  return record.ignored === true ? 'IGNORED' : 'FAILED'
}

function getStringField(record: unknown, key: string): string | undefined {
  if (!record || typeof record !== 'object') {
    return undefined
  }

  const value = (record as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : undefined
}
