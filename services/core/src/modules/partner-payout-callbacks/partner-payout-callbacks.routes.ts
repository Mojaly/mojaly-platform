import type { FastifyPluginAsync } from 'fastify'
import { partnerPayoutCallbackSchema } from './partner-payout-callbacks.schemas.js'
import { handlePartnerPayoutCallback } from './partner-payout-callbacks.service.js'

export const partnerPayoutCallbackRoutes: FastifyPluginAsync = async (app) => {
  app.post('/partner-payouts/callback', async (request, reply) => {
    const result = partnerPayoutCallbackSchema.safeParse(request.body)

    if (!result.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid partner payout callback',
          details: result.error.flatten()
        }
      })
    }

    const callbackResult = handlePartnerPayoutCallback(result.data)

    return reply.code(200).send({
      data: callbackResult
    })
  })
}