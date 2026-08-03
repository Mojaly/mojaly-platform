import type { FastifyPluginAsync } from 'fastify'
import { createDestinationResolutionSchema } from './destination-resolutions.schemas.js'
import {
  createDestinationResolution,
  mapDestinationResolutionError
} from './destination-resolutions.service.js'

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

    try {
      const intent = await createDestinationResolution(result.data)

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
    } catch (error) {
      const mappedError = mapDestinationResolutionError(error)

      if (!mappedError) {
        throw error
      }

      return reply.code(mappedError.statusCode).send({
        error: {
          code: mappedError.code,
          message: mappedError.message,
          details: mappedError.details
        }
      })
    }
  })
}
