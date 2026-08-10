import type { FastifyPluginAsync, FastifyReply } from 'fastify'
import { createWorkspaceSchema } from '../workspaces/workspace.schemas.js'
import {
  createAuthenticatedWorkspace,
  getAuthenticatedUser
} from './auth.service.js'
import { KratosAuthError } from './kratos.client.js'

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.get('/auth/me', async (request, reply) => {
    try {
      return {
        data: await getAuthenticatedUser(request)
      }
    } catch (error) {
      return mapAuthError(error, reply)
    }
  })

  app.post('/auth/workspaces', async (request, reply) => {
    const result = createWorkspaceSchema
      .omit({ ownerEmail: true })
      .safeParse(request.body)

    if (!result.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid workspace request',
          details: result.error.flatten()
        }
      })
    }

    try {
      return reply.code(201).send({
        data: await createAuthenticatedWorkspace(request, result.data)
      })
    } catch (error) {
      return mapAuthError(error, reply)
    }
  })
}

function mapAuthError(error: unknown, reply: FastifyReply) {
  if (error instanceof KratosAuthError) {
    return reply.code(401).send({
      error: {
        code: 'UNAUTHENTICATED',
        message: error.message
      }
    })
  }

  throw error
}