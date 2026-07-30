import type { FastifyPluginAsync } from 'fastify'
import { createRafikiClient } from './rafiki.factory.js'

export const rafikiRoutes: FastifyPluginAsync = async (app) => {
  const rafikiClient = createRafikiClient()

  app.get('/internal/rafiki/assets', async (_request, reply) => {
    const assets = await rafikiClient.listAssets({ first: 100 })

    return reply.code(200).send({
      data: assets
    })
  })
}