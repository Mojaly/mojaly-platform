import type { FastifyPluginAsync } from 'fastify'
import { createDestinationResolutionSchema } from './destination-resolutions.schemas.js'
import { createDestinationResolution } from './destination-resolutions.service.js'

export const destinationResolutionRoutes: FastifyPluginAsync = async (app) => {
  app.post('/destination-resolutions', async (request, reply) => {
    const result = createDestinationResolutionSchema.safeParse(request.body)

    if (!result.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid destination resolution request',
          details: result.error.flatten()
        }
      })
    }

    const intent = createDestinationResolution(result.data)

    return reply.code(201).send({
      data: {
        paymentIntentId: intent.id,
        walletAddress: intent.walletAddress,
        paymentReference: intent.id,
        partnerCode: intent.partnerCode,
        status: intent.status,
        expiresAt: intent.expiresAt
      }
    })
  })
}