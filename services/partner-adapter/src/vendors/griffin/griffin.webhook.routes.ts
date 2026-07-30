import type { FastifyPluginAsync } from 'fastify'
import { griffinWebhookEventSchema } from './griffin.webhook.schemas.js'
import { handleGriffinWebhookEvent } from './griffin.webhook.service.js'
import {
  GriffinWebhookSignatureError,
  verifyGriffinWebhookSignature
} from './griffin.webhook-signature.js'

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

    const webhookResult = await handleGriffinWebhookEvent(result.data)

    return reply.code(200).send({
      data: webhookResult
    })
  })
}
