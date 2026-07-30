import type { FastifyPluginAsync } from 'fastify'
import { mtnTransferCallbackSchema } from './mtn.webhook.schemas.js'
import { handleMtnTransferCallback } from './mtn.webhook.service.js'

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

    const callbackResult = await handleMtnTransferCallback(
      params.referenceId,
      result.data
    )

    return reply.code(200).send({
      data: callbackResult
    })
  })
}
