import type { FastifyPluginAsync } from 'fastify'
import { safaricomB2cCallbackSchema } from './safaricom.webhook.schemas.js'
import {
  handleSafaricomB2cResult,
  handleSafaricomTimeout
} from './safaricom.webhook.service.js'

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

    const callbackResult = await handleSafaricomB2cResult(result.data)

    return reply.code(200).send({
      data: callbackResult
    })
  })

  app.post('/webhooks/safaricom/b2c/timeout', async (request, reply) => {
    const callbackResult = await handleSafaricomTimeout(request.body)

    return reply.code(200).send({
      data: callbackResult
    })
  })
}
