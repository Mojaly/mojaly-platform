import type { FastifyPluginAsync } from 'fastify'
import {
  getPaymentIntentById,
  listPaymentIntents
} from './payment-intent.store.js'

export const paymentIntentRoutes: FastifyPluginAsync = async (app) => {
  app.get('/payment-intents', async () => {
    return {
      data: await listPaymentIntents()
    }
  })

  app.get('/payment-intents/:id', async (request, reply) => {
    const params = request.params as { id: string }
    const intent = await getPaymentIntentById(params.id)

    if (!intent) {
      return reply.code(404).send({
        error: {
          code: 'PAYMENT_INTENT_NOT_FOUND',
          message: 'Payment intent not found'
        }
      })
    }

    return {
      data: intent
    }
  })
}
