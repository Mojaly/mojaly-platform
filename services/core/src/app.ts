import Fastify from 'fastify'
import { healthRoutes } from './modules/health/health.routes.js'
import { destinationResolutionRoutes } from './modules/destination-resolutions/destination-resolutions.routes.js'
import { paymentIntentRoutes } from './modules/payment-intents/payment-intents.routes.js'
import { partnerPayoutCallbackRoutes } from './modules/partner-payout-callbacks/partner-payout-callbacks.routes.js'
import { rafikiRoutes } from './modules/rafiki/rafiki.routes.js'
import { developerKeyRoutes } from './modules/developer-keys/developer-keys.routes.js'
import { accountRoutes } from './modules/account/account.routes.js'
import { transactionRoutes } from './modules/transaction/transaction.routes.js'
import { walletAddressRoutes } from './modules/wallet-addresses/wallet-address.routes.js'

export function buildApp() {
  const app = Fastify({
    logger: true
  })

  app.register(healthRoutes)
  app.register(destinationResolutionRoutes)
  app.register(paymentIntentRoutes)
  app.register(partnerPayoutCallbackRoutes)
  app.register(rafikiRoutes)
  app.register(developerKeyRoutes)
  app.register(accountRoutes)
  app.register(transactionRoutes)
  app.register(walletAddressRoutes)

  return app
}


