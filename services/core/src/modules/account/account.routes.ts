import type { FastifyPluginAsync } from 'fastify'
import {
  accountIdParamsSchema,
  createAccountSchema,
  fintechAccountsParamsSchema
} from './account.schemas.js'
import {
  createAccount,
  getAccount,
  getAccountBalance,
  getAccounts,
  getFintechAccounts
} from './account.service.js'

export const accountRoutes: FastifyPluginAsync = async (app) => {
  app.post('/accounts', async (request, reply) => {
    const result = createAccountSchema.safeParse(request.body)

    if (!result.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid account request',
          details: result.error.flatten()
        }
      })
    }

    return reply.code(201).send({
      data: createAccount(result.data)
    })
  })

  app.get('/accounts', async () => {
    return {
      data: getAccounts()
    }
  })

  app.get('/accounts/:id/balance', async (request, reply) => {
    const result = accountIdParamsSchema.safeParse(request.params)

    if (!result.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid account id',
          details: result.error.flatten()
        }
      })
    }

    try {
      const balance = await getAccountBalance(result.data.id)

      return {
        data: balance
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'ACCOUNT_NOT_FOUND') {
        return reply.code(404).send({
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Account not found'
          }
        })
      }

      throw error
    }
  })

  app.get('/accounts/:id', async (request, reply) => {
    const result = accountIdParamsSchema.safeParse(request.params)

    if (!result.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid account id',
          details: result.error.flatten()
        }
      })
    }

    const account = getAccount(result.data.id)

    if (!account) {
      return reply.code(404).send({
        error: {
          code: 'ACCOUNT_NOT_FOUND',
          message: 'Account not found'
        }
      })
    }

    return {
      data: account
    }
  })

  app.get('/fintechs/:fintechId/accounts', async (request, reply) => {
    const result = fintechAccountsParamsSchema.safeParse(request.params)

    if (!result.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid fintech id',
          details: result.error.flatten()
        }
      })
    }

    return {
      data: getFintechAccounts(result.data.fintechId)
    }
  })
}

