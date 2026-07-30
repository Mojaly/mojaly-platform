import Fastify from 'fastify'
import { healthRoutes } from './modules/health/health.routes.js'
import { destinationResolutionRoutes } from './modules/destination-resolutions/destination-resolutions.routes.js'
import { paymentIntentRoutes } from './modules/payment-intents/payment-intents.routes.js'
import { rafikiWebhookRoutes } from './modules/rafiki-webhooks/rafiki-webhooks.routes.js'
import { partnerPayoutCallbackRoutes } from './modules/partner-payout-callbacks/partner-payout-callbacks.routes.js'
import { rafikiRoutes } from './modules/rafiki/rafiki.routes.js'

export function buildApp() {
  const app = Fastify({
    logger: true
  })

  app.register(healthRoutes)
  app.register(destinationResolutionRoutes)
  app.register(paymentIntentRoutes)
  app.register(rafikiWebhookRoutes)
  app.register(partnerPayoutCallbackRoutes)
  app.register(rafikiRoutes)

  return app
}