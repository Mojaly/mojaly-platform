import type { FastifyPluginAsync } from 'fastify'
import {
  getBalanceParamsSchema,
  getBalanceQuerySchema
} from './balances.schemas.js'
import { getPartnerBalance } from './balances.service.js'

export const balancesRoutes: FastifyPluginAsync = async (app) => {
  app.get('/partners/:partnerCode/accounts/:externalAccountId/balance', async (request, reply) => {
    const paramsResult = getBalanceParamsSchema.safeParse(request.params)
    const queryResult = getBalanceQuerySchema.safeParse(request.query)

    if (!paramsResult.success || !queryResult.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid balance request'
        }
      })
    }

    try {
      const balance = await getPartnerBalance({
        partnerCode: paramsResult.data.partnerCode,
        externalAccountId: paramsResult.data.externalAccountId,
        assetCode: queryResult.data.assetCode,
        assetScale: queryResult.data.assetScale
      })

      return {
        data: balance
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'PARTNER_NOT_FOUND') {
        return reply.code(404).send({
          error: {
            code: 'PARTNER_NOT_FOUND',
            message: 'Partner not found'
          }
        })
      }

      if (
        error instanceof Error &&
        error.message === 'PARTNER_BALANCE_NOT_SUPPORTED'
      ) {
        return reply.code(501).send({
          error: {
            code: 'PARTNER_BALANCE_NOT_SUPPORTED',
            message: 'This partner does not support balance checks yet'
          }
        })
      }

      throw error
    }
  })
}