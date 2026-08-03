import type { FastifyPluginAsync, FastifyReply } from 'fastify'
import {
  createDeveloperKeyBodySchema,
  createDeveloperKeyParamsSchema,
  listDeveloperKeysParamsSchema,
  listWalletDeveloperKeysParamsSchema,
  revokeDeveloperKeyParamsSchema
} from './developer-keys.schemas.js'
import {
  createDeveloperKey,
  listDeveloperKeys,
  listDeveloperKeysForWallet,
  revokeDeveloperKey
} from './developer-keys.service.js'

export const developerKeyRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    '/workspaces/:workspaceId/wallet-addresses/:walletAddressId/developer-keys',
    async (request, reply) => {
      const params = createDeveloperKeyParamsSchema.safeParse(request.params)
      const body = createDeveloperKeyBodySchema.safeParse(request.body)

      if (!params.success || !body.success) {
        return reply.code(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid developer key request',
            details: {
              params: params.success ? undefined : params.error.flatten(),
              body: body.success ? undefined : body.error.flatten()
            }
          }
        })
      }

      try {
        const created = await createDeveloperKey({
          workspaceId: params.data.workspaceId,
          walletAddressId: params.data.walletAddressId,
          name: body.data.name
        })

        return reply.code(201).send({
          data: {
            key: created.key,
            privateKey: created.privateKey,
            publicKey: created.publicKey,
            keyId: created.keyId,
            walletAddressUrl: created.walletAddressUrl
          }
        })
      } catch (error) {
        return mapDeveloperKeyError(error, reply)
      }
    }
  )

  app.get('/workspaces/:workspaceId/developer-keys', async (request, reply) => {
    const result = listDeveloperKeysParamsSchema.safeParse(request.params)

    if (!result.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid workspace id',
          details: result.error.flatten()
        }
      })
    }

    return reply.send({
      data: listDeveloperKeys(result.data.workspaceId)
    })
  })

  app.get(
    '/workspaces/:workspaceId/wallet-addresses/:walletAddressId/developer-keys',
    async (request, reply) => {
      const result = listWalletDeveloperKeysParamsSchema.safeParse(
        request.params
      )

      if (!result.success) {
        return reply.code(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid wallet developer keys request',
            details: result.error.flatten()
          }
        })
      }

      try {
        return reply.send({
          data: listDeveloperKeysForWallet(
            result.data.workspaceId,
            result.data.walletAddressId
          )
        })
      } catch (error) {
        return mapDeveloperKeyError(error, reply)
      }
    }
  )

  app.post(
    '/workspaces/:workspaceId/wallet-addresses/:walletAddressId/developer-keys/:keyId/revoke',
    async (request, reply) => {
      const result = revokeDeveloperKeyParamsSchema.safeParse(request.params)

      if (!result.success) {
        return reply.code(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid developer key revoke request',
            details: result.error.flatten()
          }
        })
      }

      let revoked
      try {
        revoked = await revokeDeveloperKey(result.data)
      } catch (error) {
        return mapDeveloperKeyError(error, reply)
      }

      if (!revoked) {
        return reply.code(404).send({
          error: {
            code: 'NOT_FOUND',
            message: 'developer key not found'
          }
        })
      }

      return reply.send({
        data: revoked
      })
    }
  )
}

function mapDeveloperKeyError(error: unknown, reply: FastifyReply) {
  if (!(error instanceof Error)) {
    throw error
  }

  const statusByCode: Record<string, number> = {
    WALLET_ADDRESS_NOT_FOUND: 404,
    WALLET_ADDRESS_WORKSPACE_MISMATCH: 403,
    WALLET_ADDRESS_INACTIVE: 409
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