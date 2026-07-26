import type { FastifyPluginAsync } from 'fastify'
import { createDestinationResolution } from '../../clients/core.client.js'

export const paymentDestinationRoutes: FastifyPluginAsync = async (app) => {
  app.post('/v1/payment-destinations/resolve', async (request, reply) => {
    const result = await createDestinationResolution(request.body)
    return reply.code(201).send(result)
  })
}

