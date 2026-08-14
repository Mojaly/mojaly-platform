import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { env } from '../../config/env.js'
import { RafikiAuthClient } from './rafiki-auth.client.js'

const paramsSchema = z.object({
  interactionId: z.string().min(1),
  nonce: z.string().min(1)
})

const querySchema = z.object({
  interactId: z.string().min(1),
  nonce: z.string().min(1),
  clientName: z.string().optional(),
  clientUri: z.string().optional()
})

const responseSchema = z.object({
  response: z.enum(['accept', 'reject'])
})

const client = new RafikiAuthClient(env)

export async function grantInteractionRoutes(app: FastifyInstance) {
  app.get('/grant-interactions', async (request) => {
    const query = querySchema.parse(request.query)
    const grant = await client.getGrantByInteraction(query.interactId, query.nonce)

    return {
      data: grant,
      interaction: {
        id: query.interactId,
        nonce: query.nonce,
        clientName: query.clientName,
        clientUri: query.clientUri
      },
      approval: {
        method: 'PATCH',
        url: `/grant-interactions/${query.interactId}/${query.nonce}`,
        body: {
          response: 'accept'
        }
      }
    }
  })

  app.get('/grant-interactions/:interactionId/:nonce', async (request) => {
    const params = paramsSchema.parse(request.params)
    const grant = await client.getGrantByInteraction(
      params.interactionId,
      params.nonce
    )

    return {
      data: grant
    }
  })

  app.patch('/grant-interactions/:interactionId/:nonce', async (request) => {
    const params = paramsSchema.parse(request.params)
    const body = responseSchema.parse(request.body)

    const grant = await client.setInteractionResponse(
      params.interactionId,
      params.nonce,
      body.response
    )

    return {
      data: grant
    }
  })
}
