import Fastify from 'fastify'
import { healthRoutes } from './modules/health/health.routes.js'
import { destinationResolutionRoutes } from './modules/destination-resolutions/destination-resolutions.routes.js'
import { paymentIntentRoutes } from './modules/payment-intents/payment-intents.routes.js'

export function buildApp() {
  const app = Fastify({
    logger: true
  })

  app.register(healthRoutes)
  app.register(destinationResolutionRoutes)
  app.register(paymentIntentRoutes)

  return app
}