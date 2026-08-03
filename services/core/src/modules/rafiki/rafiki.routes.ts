import type { FastifyPluginAsync } from 'fastify'
import { createRafikiClient } from './rafiki.factory.js'
import { handleRafikiWebhook } from './service.js'
import { webhookSchema } from './validation.js'
import { verifyRafikiWebhookSignature } from './webhook-signature.js'

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

    const response = await handleRafikiWebhook(result.data, rafikiClient)

    return reply.code(200).send({
      data: response
    })
  })
}


