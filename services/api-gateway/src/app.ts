import Fastify from 'fastify'
import { errorHandler } from './common/errors/error-handler.js'
import { paymentDestinationRoutes } from './modules/payment-destinations/payment-destinations.routes.js'
import { healthRoutes } from './modules/health/health.routes.js'

export function buildApp() {
  const app = Fastify({
    logger: true
  })

  app.setErrorHandler(errorHandler)
  app.register(healthRoutes)
  app.register(paymentDestinationRoutes)


  return app
}

