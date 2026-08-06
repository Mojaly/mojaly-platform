import type { FastifyPluginAsync, FastifyReply } from 'fastify'
import {
  accountWalletAddressesParamsSchema,
  createWalletAddressBodySchema,
  fintechWalletAddressesParamsSchema,
  walletAddressIdParamsSchema,
  workspaceAccountWalletAddressesParamsSchema,
  workspaceWalletAddressesParamsSchema
} from './wallet-address.schemas.js'
import {
  createWalletAddress,
  getAccountWalletAddresses,
  getFintechWalletAddresses,
  getWalletAddress,
  getWalletAddresses,
  getWorkspaceWalletAddresses
} from './wallet-address.service.js'

function mapWalletAddressError(error: unknown, reply: FastifyReply) {
  if (!(error instanceof Error)) {
    throw error
  }

  const statusByCode: Record<string, number> = {
    ACCOUNT_NOT_FOUND: 404,
    ACCOUNT_WORKSPACE_MISMATCH: 403,
    ACCOUNT_INACTIVE: 409,
    ACCOUNT_RAFIKI_ASSET_MISSING: 409,
    WALLET_ADDRESS_ALREADY_EXISTS: 409,
    PARTNER_ROUTE_NOT_FOUND: 409
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

export const walletAddressRoutes: FastifyPluginAsync = async (app) => {
  app.post('/accounts/:accountId/wallet-addresses', async (request, reply) => {
    const params = accountWalletAddressesParamsSchema.safeParse(request.params)
    const body = createWalletAddressBodySchema.safeParse(request.body)

    if (!params.success || !body.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid wallet address request',
          details: {
            params: params.success ? undefined : params.error.flatten(),
            body: body.success ? undefined : body.error.flatten()
          }
        }
      })
    }

    try {
      const walletAddress = await createWalletAddress({
        accountId: params.data.accountId,
        walletAddressName: body.data.walletAddressName,
        publicName: body.data.publicName
      })

      return reply.code(201).send({ data: walletAddress })
    } catch (error) {
      return mapWalletAddressError(error, reply)
    }
  })

  app.post(
    '/workspaces/:workspaceId/accounts/:accountId/wallet-addresses',
    async (request, reply) => {
      const params = workspaceAccountWalletAddressesParamsSchema.safeParse(
        request.params
      )
      const body = createWalletAddressBodySchema.safeParse(request.body)

      if (!params.success || !body.success) {
        return reply.code(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid workspace wallet address request',
            details: {
              params: params.success ? undefined : params.error.flatten(),
              body: body.success ? undefined : body.error.flatten()
            }
          }
        })
      }

      try {
        const walletAddress = await createWalletAddress({
          workspaceId: params.data.workspaceId,
          accountId: params.data.accountId,
          walletAddressName: body.data.walletAddressName,
          publicName: body.data.publicName
        })

        return reply.code(201).send({ data: walletAddress })
      } catch (error) {
        return mapWalletAddressError(error, reply)
      }
    }
  )

  app.get('/wallet-addresses', async () => {
    return { data: getWalletAddresses() }
  })

  app.get('/wallet-addresses/:id', async (request, reply) => {
    const result = walletAddressIdParamsSchema.safeParse(request.params)

    if (!result.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid wallet address id',
          details: result.error.flatten()
        }
      })
    }

    const walletAddress = getWalletAddress(result.data.id)

    if (!walletAddress) {
      return reply.code(404).send({
        error: {
          code: 'WALLET_ADDRESS_NOT_FOUND',
          message: 'Wallet address not found'
        }
      })
    }

    return { data: walletAddress }
  })

  app.get('/accounts/:accountId/wallet-addresses', async (request, reply) => {
    const result = accountWalletAddressesParamsSchema.safeParse(request.params)

    if (!result.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid account id',
          details: result.error.flatten()
        }
      })
    }

    return { data: getAccountWalletAddresses(result.data.accountId) }
  })

  app.get('/workspaces/:workspaceId/wallet-addresses', async (request, reply) => {
    const result = workspaceWalletAddressesParamsSchema.safeParse(request.params)

    if (!result.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid workspace id',
          details: result.error.flatten()
        }
      })
    }

    return { data: getWorkspaceWalletAddresses(result.data.workspaceId) }
  })

  app.get('/fintechs/:fintechId/wallet-addresses', async (request, reply) => {
    const result = fintechWalletAddressesParamsSchema.safeParse(request.params)

    if (!result.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid fintech id',
          details: result.error.flatten()
        }
      })
    }

    return { data: getFintechWalletAddresses(result.data.fintechId) }
  })
}
