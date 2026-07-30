import Fastify from 'fastify'
import { healthRoutes } from './modules/health/health.routes.js'
import { payoutsRoutes } from './modules/payouts/payouts.routes.js'
import { registerPartner } from './modules/partners/partner-registry.js'
import { GriffinClient } from './vendors/griffin/griffin.client.js'
import { griffinWebhookRoutes } from './vendors/griffin/griffin.webhook.routes.js'
import type { FastifyRequest } from 'fastify'
import { MtnClient } from './vendors/mtn/mtn.client.js'
import { mtnWebhookRoutes } from './vendors/mtn/mtn.webhook.routes.js'
import { SafaricomClient } from './vendors/safaricom/safaricom.client.js'
import { safaricomWebhookRoutes } from './vendors/safaricom/safaricom.webhook.routes.js'

declare module 'fastify' {
  interface FastifyRequest {
    rawBody?: Buffer
  }
}

export function buildApp() {
  const app = Fastify({
    logger: true
  })

  app.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    (request: FastifyRequest, body, done) => {
      request.rawBody = Buffer.isBuffer(body) ? body : Buffer.from(body)

      try {
        done(null, JSON.parse(request.rawBody.toString('utf8')))
      } catch (error) {
        done(error as Error)
      }
    }
  )

  registerPartner(new GriffinClient())
  registerPartner(new MtnClient())
  registerPartner(new SafaricomClient())

  app.register(healthRoutes)
  app.register(payoutsRoutes)
  app.register(griffinWebhookRoutes)
  app.register(mtnWebhookRoutes)
  app.register(safaricomWebhookRoutes)

  return app
}
