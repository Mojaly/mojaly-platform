import type { FastifyPluginAsync } from 'fastify'
import { createPayoutSchema } from './payouts.schemas.js'
import {
  createPayout,
  findPayout,
  findPayouts,
  refreshPayoutStatus
} from './payouts.service.js'

export const payoutsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/payouts', async () => {
    return {
      data: findPayouts()
    }
  })

  app.get('/payouts/:id', async (request, reply) => {
    const params = request.params as { id: string }
    const payout = findPayout(params.id)

    if (!payout) {
      return reply.code(404).send({
        error: {
          code: 'PAYOUT_NOT_FOUND',
          message: 'Payout not found'
        }
      })
    }

    return {
      data: payout
    }
  })

  app.post('/payouts/:id/refresh-status', async (request, reply) => {
    const params = request.params as { id: string }
    const payout = await refreshPayoutStatus(params.id)

    if (!payout) {
      return reply.code(404).send({
        error: {
          code: 'PAYOUT_NOT_FOUND',
          message: 'Payout not found'
        }
      })
    }

    return {
      data: payout
    }
  })

  app.post('/payouts', async (request, reply) => {
    const result = createPayoutSchema.safeParse(request.body)

    if (!result.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid payout request',
          details: result.error.flatten()
        }
      })
    }

    const payout = await createPayout(result.data)

    return reply.code(201).send({
      data: payout
    })
  })
}
