import type { FastifyPluginAsync } from 'fastify'
import {
  accountTransactionsParamsSchema,
  createTransactionSchema,
  transactionIdParamsSchema,
  updateTransactionStatusSchema
} from './transaction.schemas.js'
import {
  createTransaction,
  getAccountTransactions,
  getTransaction,
  getTransactions,
  updateTransactionStatus
} from './transaction.service.js'

export const transactionRoutes: FastifyPluginAsync = async (app) => {
  app.post('/transactions', async (request, reply) => {
    const result = createTransactionSchema.safeParse(request.body)

    if (!result.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid transaction request',
          details: result.error.flatten()
        }
      })
    }

    try {
      return reply.code(201).send({
        data: await createTransaction(result.data)
      })
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

  app.get('/transactions', async () => {
    return {
      data: await getTransactions()
    }
  })

  app.get('/transactions/:id', async (request, reply) => {
    const result = transactionIdParamsSchema.safeParse(request.params)

    if (!result.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid transaction id',
          details: result.error.flatten()
        }
      })
    }

    const transaction = await getTransaction(result.data.id)

    if (!transaction) {
      return reply.code(404).send({
        error: {
          code: 'TRANSACTION_NOT_FOUND',
          message: 'Transaction not found'
        }
      })
    }

    return {
      data: transaction
    }
  })

  app.patch('/transactions/:id/status', async (request, reply) => {
    const paramsResult = transactionIdParamsSchema.safeParse(request.params)
    const bodyResult = updateTransactionStatusSchema.safeParse(request.body)

    if (!paramsResult.success || !bodyResult.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid transaction status request'
        }
      })
    }

    const transaction = await updateTransactionStatus(paramsResult.data.id, bodyResult.data)

    if (!transaction) {
      return reply.code(404).send({
        error: {
          code: 'TRANSACTION_NOT_FOUND',
          message: 'Transaction not found'
        }
      })
    }

    return {
      data: transaction
    }
  })

  app.get('/accounts/:accountId/transactions', async (request, reply) => {
    const result = accountTransactionsParamsSchema.safeParse(request.params)

    if (!result.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid account id',
          details: result.error.flatten()
        }
      })
    }

    return {
      data: await getAccountTransactions(result.data.accountId)
    }
  })
}

