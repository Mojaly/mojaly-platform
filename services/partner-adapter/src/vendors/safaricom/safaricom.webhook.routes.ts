import type { FastifyPluginAsync } from 'fastify'
import { safaricomB2cCallbackSchema } from './safaricom.webhook.schemas.js'
import {
  handleSafaricomB2cResult,
  handleSafaricomTimeout
} from './safaricom.webhook.service.js'
import { saveWebhookEvent } from '../../modules/webhook-events/webhook-event.store.js'

export const safaricomWebhookRoutes: FastifyPluginAsync = async (app) => {
  app.post('/webhooks/safaricom/b2c/result', async (request, reply) => {
    const result = safaricomB2cCallbackSchema.safeParse(request.body)

    if (!result.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid Safaricom B2C result payload',
          details: result.error.flatten()
        }
      })
    }

    const externalEventId =
      result.data.Result.OriginatorConversationID ??
      result.data.Result.ConversationID ??
      result.data.Result.TransactionID

    await saveWebhookEvent({
      source: 'SAFARICOM',
      eventType: 'b2c-result',
      externalEventId,
      signatureVerified: false,
      payload: result.data,
      handlingStatus: 'RECEIVED'
    })

    const callbackResult = await handleSafaricomB2cResult(result.data)

    await saveWebhookEvent({
      source: 'SAFARICOM',
      eventType: 'b2c-result',
      externalEventId,
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

  app.post('/webhooks/safaricom/b2c/timeout', async (request, reply) => {
    await saveWebhookEvent({
      source: 'SAFARICOM',
      eventType: 'b2c-timeout',
      externalEventId: undefined,
      signatureVerified: false,
      payload: request.body,
      handlingStatus: 'RECEIVED'
    })

    const callbackResult = await handleSafaricomTimeout(request.body)

    await saveWebhookEvent({
      source: 'SAFARICOM',
      eventType: 'b2c-timeout',
      externalEventId: undefined,
      signatureVerified: false,
      payload: request.body,
      handlingStatus: 'HANDLED'
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
