import type { FastifyPluginAsync } from 'fastify'
import { handleRafikiWebhook } from './rafiki-webhooks.service.js'
import type { RafikiWebhookEvent } from './rafiki-webhooks.types.js'

export const rafikiWebhookRoutes: FastifyPluginAsync = async (app) => {
  app.post('/rafiki/webhooks', async (request, reply) => {
    const event = request.body as RafikiWebhookEvent
    const result = await  handleRafikiWebhook(event)

    return reply.code(200).send({
      data: result
    })
  })
}