import Fastify from 'fastify'
import { healthRoutes } from './modules/health/health.routes.js'
import { payoutsRoutes } from './modules/payouts/payouts.routes.js'
import { register } from 'node:module'
import { registerPartner } from './modules/partners/partner-registry.js'
import { KcbClient } from './vendors/kcb/kcb.client.js'
import { kcbCallbackRoutes } from './vendors/kcb/kcb.callback.routes.js'
import { GriffinClient } from './vendors/griffin/griffin.client.js'

export function buildApp() {
  const app = Fastify({
    logger: true
  })
  
  registerPartner(new KcbClient)
  registerPartner(new GriffinClient())

  app.register(healthRoutes)
  app.register(payoutsRoutes)
  app.register(kcbCallbackRoutes)

  return app
}