import type { FastifyPluginAsync } from 'fastify'
import { createRafikiClient } from './rafiki.factory.js'
import { handleRafikiWebhook } from './service.js'
import { webhookSchema } from './validation.js'
import { verifyRafikiWebhookSignature } from './webhook-signature.js'
import {
  saveWebhookEvent,
  type WebhookHandlingStatus
} from '../webhook-events/webhook-event.store.js'

export const rafikiRoutes: FastifyPluginAsync = async (app) => {
  const rafikiClient = createRafikiClient()

  app.get('/internal/rafiki/assets', async (_request, reply) => {
    const assets = await rafikiClient.listAssets({ first: 100 })

    return reply.code(200).send({
      data: assets
    })
  })

  app.post('/rafiki/webhooks', async (request, reply) => {
    const signature = verifyRafikiWebhookSignature(request)

    if (!signature.valid) {
      return reply.code(401).send({
        error: {
          code: 'INVALID_RAFIKI_SIGNATURE',
          message: signature.reason
        }
      })
    }

    const result = webhookSchema.safeParse(request.body)

    if (!result.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid Rafiki webhook event',
          details: result.error.flatten()
        }
      })
    }

    await saveWebhookEvent({
      source: 'RAFIKI',
      eventType: result.data.type,
      externalEventId: result.data.id,
      signatureVerified: true,
      payload: result.data,
      handlingStatus: 'RECEIVED'
    })

    const response = await handleRafikiWebhook(result.data, rafikiClient)
    const handlingStatus = getHandlingStatus(response)

    await saveWebhookEvent({
      source: 'RAFIKI',
      eventType: result.data.type,
      externalEventId: result.data.id,
      paymentIntentId: getStringField(response, 'paymentIntentId'),
      signatureVerified: true,
      payload: result.data,
      handlingStatus,
      failureReason: getStringField(response, 'reason')
    })

    return reply.code(200).send({
      data: response
    })
  })
}

function getHandlingStatus(response: unknown): WebhookHandlingStatus {
  if (!response || typeof response !== 'object') {
    return 'FAILED'
  }

  const record = response as Record<string, unknown>

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

