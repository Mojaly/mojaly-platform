import Fastify from 'fastify'
import { healthRoutes } from './modules/health/health.routes.js'
import { grantInteractionRoutes } from './modules/grant-interactions/grant-interactions.routes.js'

export function buildApp() {
  const app = Fastify({
    logger: true
  })

  app.register(healthRoutes)
  app.register(grantInteractionRoutes)

  return app
}
