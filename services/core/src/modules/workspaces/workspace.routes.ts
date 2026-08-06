import type { FastifyPluginAsync, FastifyReply } from 'fastify'
import {
  createWorkspaceSchema,
  rejectWorkspaceSchema,
  submitKybSchema,
  workspaceIdParamsSchema
} from './workspace.schemas.js'
import {
  approveWorkspace,
  createWorkspace,
  getWorkspace,
  getWorkspaceKyb,
  getWorkspaces,
  rejectWorkspace,
  submitWorkspaceKyb,
  suspendWorkspace
} from './workspace.service.js'

export const workspaceRoutes: FastifyPluginAsync = async (app) => {
  app.post('/workspaces', async (request, reply) => {
    const result = createWorkspaceSchema.safeParse(request.body)

    if (!result.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid workspace request',
          details: result.error.flatten()
        }
      })
    }

    return reply.code(201).send({
      data: createWorkspace(result.data)
    })
  })

  app.get('/workspaces', async () => {
    return { data: getWorkspaces() }
  })

  app.get('/workspaces/:id', async (request, reply) => {
    const params = workspaceIdParamsSchema.safeParse(request.params)

    if (!params.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid workspace id',
          details: params.error.flatten()
        }
      })
    }

    const workspace = getWorkspace(params.data.id)

    if (!workspace) {
      return reply.code(404).send({
        error: {
          code: 'WORKSPACE_NOT_FOUND',
          message: 'Workspace not found'
        }
      })
    }

    return { data: workspace }
  })

  app.post('/workspaces/:id/submit-kyb', async (request, reply) => {
    const params = workspaceIdParamsSchema.safeParse(request.params)
    const body = submitKybSchema.safeParse(request.body)

    if (!params.success || !body.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid KYB submission',
          details: {
            params: params.success ? undefined : params.error.flatten(),
            body: body.success ? undefined : body.error.flatten()
          }
        }
      })
    }

    try {
      return reply.code(201).send({
        data: submitWorkspaceKyb(params.data.id, body.data)
      })
    } catch (error) {
      return mapWorkspaceError(error, reply)
    }
  })

  app.get('/workspaces/:id/kyb', async (request, reply) => {
    const params = workspaceIdParamsSchema.safeParse(request.params)

    if (!params.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid workspace id',
          details: params.error.flatten()
        }
      })
    }

    try {
      const kyb = getWorkspaceKyb(params.data.id)

      if (!kyb) {
        return reply.code(404).send({
          error: {
            code: 'KYB_NOT_SUBMITTED',
            message: 'KYB has not been submitted'
          }
        })
      }

      return { data: kyb }
    } catch (error) {
      return mapWorkspaceError(error, reply)
    }
  })

  app.post('/workspaces/:id/approve', async (request, reply) => {
    const params = workspaceIdParamsSchema.safeParse(request.params)

    if (!params.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid workspace id',
          details: params.error.flatten()
        }
      })
    }

    try {
      return { data: approveWorkspace(params.data.id) }
    } catch (error) {
      return mapWorkspaceError(error, reply)
    }
  })

  app.post('/workspaces/:id/reject', async (request, reply) => {
    const params = workspaceIdParamsSchema.safeParse(request.params)
    const body = rejectWorkspaceSchema.safeParse(request.body)

    if (!params.success || !body.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid workspace rejection',
          details: {
            params: params.success ? undefined : params.error.flatten(),
            body: body.success ? undefined : body.error.flatten()
          }
        }
      })
    }

    try {
      return { data: rejectWorkspace(params.data.id, body.data.reason) }
    } catch (error) {
      return mapWorkspaceError(error, reply)
    }
  })

  app.post('/workspaces/:id/suspend', async (request, reply) => {
    const params = workspaceIdParamsSchema.safeParse(request.params)

    if (!params.success) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid workspace id',
          details: params.error.flatten()
        }
      })
    }

    try {
      return { data: suspendWorkspace(params.data.id) }
    } catch (error) {
      return mapWorkspaceError(error, reply)
    }
  })
}

function mapWorkspaceError(error: unknown, reply: FastifyReply) {
  if (!(error instanceof Error)) {
    throw error
  }

  const statusByCode: Record<string, number> = {
    WORKSPACE_NOT_FOUND: 404,
    KYB_NOT_SUBMITTED: 409,
    WORKSPACE_REJECTED: 409,
    WORKSPACE_SUSPENDED: 409
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
