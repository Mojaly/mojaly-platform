import type { FastifyPluginAsync, FastifyReply } from 'fastify'
import {
  accountIdParamsSchema,
  createAccountSchema,
  createWorkspaceAccountSchema,
  fintechAccountsParamsSchema,
  workspaceAccountsParamsSchema
} from './account.schemas.js'
import {
  createAccount,
  getAccount,
  getAccountBalance,
  getAccounts,
  getFintechAccounts,
  getWorkspaceAccounts
} from './account.service.js'

function mapAccountError(error: unknown, reply: FastifyReply) {
  if (!(error instanceof Error)) {
    throw error
  }

  const statusByCode: Record<string, number> = {
    ACCOUNT_WORKSPACE_REQUIRED: 400,
    WORKSPACE_NOT_FOUND: 404,
    WORKSPACE_NOT_ACTIVE: 409,
    ACCOUNT_NOT_FOUND: 404
  }

  const statusCode = statusByCode[error.message]

  if (!statusCode) {
    throw error
  }

  return reply.code(statusCode).send({
    error: {
      code: error.message,
      message: error.message.toLowerCase().replaceAll('_', ' ')
    }
  })
}

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

    try {
      return reply.code(201).send({
        data: await createAccount(result.data)
      })
    } catch (error) {
      return mapAccountError(error, reply)
    }
  })

  app.post('/workspaces/:workspaceId/accounts', async (request, reply) => {
    const params = workspaceAccountsParamsSchema.safeParse(request.params)
    const body = createWorkspaceAccountSchema.safeParse(request.body)

    if (!params.success || !body.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid workspace account request',
          details: {
            params: params.success ? undefined : params.error.flatten(),
            body: body.success ? undefined : body.error.flatten()
          }
        }
      })
    }

    try {
      return reply.code(201).send({
        data: await createAccount({
          ...body.data,
          workspaceId: params.data.workspaceId
        })
      })
    } catch (error) {
      return mapAccountError(error, reply)
    }
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
      return mapAccountError(error, reply)
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

  app.get('/workspaces/:workspaceId/accounts', async (request, reply) => {
    const result = workspaceAccountsParamsSchema.safeParse(request.params)

    if (!result.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid workspace id',
          details: result.error.flatten()
        }
      })
    }

    return {
      data: getWorkspaceAccounts(result.data.workspaceId)
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


