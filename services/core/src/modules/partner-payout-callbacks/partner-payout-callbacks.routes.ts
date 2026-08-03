import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { env } from '../../config/env.js'
import { partnerPayoutCallbackSchema } from './partner-payout-callbacks.schemas.js'
import { handlePartnerPayoutCallback } from './partner-payout-callbacks.service.js'

export const partnerPayoutCallbackRoutes: FastifyPluginAsync = async (app) => {
  app.post('/partner-payouts/callback', async (request, reply) => {
    if (!isTrustedPartnerAdapterRequest(request)) {
      return reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED_PARTNER_ADAPTER_CALLBACK',
          message: 'Missing or invalid partner adapter authorization'
        }
      })
    }

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

function isTrustedPartnerAdapterRequest(request: FastifyRequest): boolean {
  const authorization = request.headers.authorization

  return authorization === `Bearer ${env.PARTNER_ADAPTER_INTERNAL_API_KEY}`
}
