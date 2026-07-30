import {
  createAuthenticatedClient,
  isFinalizedGrantWithAccessToken,
  isPendingGrant
} from '@interledger/open-payments'
import axios from 'axios'
import { env } from './config.js'
import { createMojalyResolution } from './mojaly-client.js'
import {
  depositOutgoingPaymentLiquidity,
  getOutgoingPayment,
  listRecentPayments,
  listRecentWebhookEvents
} from './rafiki-admin-payments.js'
import { setupSenderWallet } from './setup-sender.js'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

async function main() {
  console.log('Setting up Open Payments sender wallet key...')
  const sender = await setupSenderWallet()

  console.log('Creating Mojaly destination resolution...')
  const resolution = await createMojalyResolution()
  console.log({
    paymentIntentId: resolution.paymentIntentId,
    partnerCode: resolution.partnerCode,
    receiverWalletAddress: resolution.walletAddress
  })

  const client = await createAuthenticatedClient({
    privateKey: sender.privateKey,
    keyId: sender.keyId,
    walletAddressUrl: sender.walletAddressUrl,
    useHttp: false
  })

  console.log('Resolving sender and receiver wallet addresses...')
  const senderWalletAddress = await client.walletAddress.get({
    url: sender.walletAddressUrl
  })
  const receiverWalletAddress = await client.walletAddress.get({
    url: resolution.walletAddress
  })

  console.log('Requesting receiver incoming-payment grant...')
  const incomingGrant = await client.grant.request(
    {
      url: receiverWalletAddress.authServer
    },
    {
      access_token: {
        access: [
          {
            type: 'incoming-payment',
            actions: ['create', 'read', 'list', 'complete']
          }
        ]
      }
    }
  )

  if (!isFinalizedGrantWithAccessToken(incomingGrant)) {
    throw new Error('Incoming payment grant was not finalized')
  }

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

  console.log('Creating incoming payment at Mojaly receiver wallet...')
  const incomingPayment = await client.incomingPayment.create(
    {
      url: receiverWalletAddress.resourceServer,
      accessToken: incomingGrant.access_token.value
    },
    {
      walletAddress: receiverWalletAddress.id,
      incomingAmount: {
        value: env.PAYMENT_AMOUNT,
        assetCode: receiverWalletAddress.assetCode,
        assetScale: receiverWalletAddress.assetScale
      },
      expiresAt,
      metadata: {
        paymentReference: resolution.paymentIntentId,
        mojalyReference: resolution.paymentReference
      }
    }
  )

  console.log('Requesting quote grant...')
  const quoteGrant = await client.grant.request(
    {
      url: senderWalletAddress.authServer
    },
    {
      access_token: {
        access: [
          {
            type: 'quote',
            actions: ['read', 'create']
          }
        ]
      }
    }
  )

  if (!isFinalizedGrantWithAccessToken(quoteGrant)) {
    throw new Error('Quote grant was not finalized')
  }

  console.log('Creating quote...')
  const quote = await client.quote.create(
    {
      url: senderWalletAddress.resourceServer,
      accessToken: quoteGrant.access_token.value
    },
    {
      walletAddress: senderWalletAddress.id,
      receiver: incomingPayment.id,
      method: 'ilp'
    }
  )

  console.log('Requesting outgoing-payment grant...')
  const outgoingGrant = await client.grant.request(
    {
      url: senderWalletAddress.authServer
    },
    {
      access_token: {
        access: [
          {
            type: 'outgoing-payment',
            actions: ['create', 'read', 'list'],
            identifier: senderWalletAddress.id,
            limits: {
              debitAmount: quote.debitAmount
            }
          }
        ]
      },
      interact: {
        start: ['redirect'],
        finish: {
          method: 'redirect',
          uri: 'https://example.com/callback',
          nonce: `nonce-${Date.now()}`
        }
      }
    }
  )

  if (!isPendingGrant(outgoingGrant)) {
    throw new Error('Outgoing payment grant did not require interaction')
  }

  console.log('\nOpen this consent URL, then rerun the continue command later if needed:')
  console.log(outgoingGrant.interact.redirect)
  console.log('\nApproving the local Rafiki interaction through the IdP API...')
  const interactRef = await approveLocalInteraction(
    outgoingGrant.interact.redirect,
    sender.idpSecret
  )

  console.log('\nWaiting for the authorization server continue window...')

  const waitSeconds =
    typeof outgoingGrant.continue.wait === 'number'
      ? outgoingGrant.continue.wait
      : 5
  await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000))

  console.log('Continuing the outgoing-payment grant...')

  const finalizedOutgoingGrant = await client.grant.continue(
    {
      accessToken: outgoingGrant.continue.access_token.value,
      url: outgoingGrant.continue.uri
    },
    {
      interact_ref: interactRef
    }
  )

  if (!isFinalizedGrantWithAccessToken(finalizedOutgoingGrant)) {
    throw new Error(
      'Outgoing payment grant is still pending. Visit the consent URL and run again.'
    )
  }

  console.log('Creating outgoing payment...')
  const outgoingPayment = await client.outgoingPayment.create(
    {
      url: senderWalletAddress.resourceServer,
      accessToken: finalizedOutgoingGrant.access_token.value
    },
    {
      walletAddress: senderWalletAddress.id,
      quoteId: quote.id
    }
  )

  console.log('Depositing outgoing payment liquidity through Rafiki Admin API...')
  await depositOutgoingPaymentLiquidity(
    outgoingPayment.id,
    sender.tenantCredentials
  )

  console.log('Waiting for Rafiki to process the outgoing payment...')
  await new Promise((resolve) => setTimeout(resolve, 3_000))

  const finalOutgoingPayment = await getOutgoingPayment(
    outgoingPayment.id,
    sender.tenantCredentials
  )

  console.log('Real Rafiki payment flow completed.')
  console.log({
    incomingPaymentId: incomingPayment.id,
    quoteId: quote.id,
    outgoingPaymentId: outgoingPayment.id,
    outgoingPaymentState: finalOutgoingPayment?.state ?? 'UNKNOWN',
    outgoingPaymentError: finalOutgoingPayment?.error ?? null,
    paymentIntentId: resolution.paymentIntentId
  })

  console.log('Recent Rafiki payments:')
  console.log(await listRecentPayments())

  console.log('Recent Rafiki webhook events:')
  console.log(await listRecentWebhookEvents())
}

async function approveLocalInteraction(
  redirectUrl: string,
  idpSecret: string
): Promise<string> {
  if (!idpSecret) {
    throw new Error('Cannot approve interaction because tenant idpSecret is empty')
  }

  const url = new URL(redirectUrl)
  const [, interactId, nonce] = url.pathname.match(
    /^\/interact\/([^/]+)\/([^/]+)$/
  ) ?? []

  if (!interactId || !nonce) {
    throw new Error(`Could not parse interaction URL: ${redirectUrl}`)
  }

  const interactionStart = await axios.get(redirectUrl, {
    timeout: 10_000,
    maxRedirects: 0,
    validateStatus: (status) => status >= 200 && status < 400
  })
  const cookies = interactionStart.headers['set-cookie']
  const cookieHeader = Array.isArray(cookies)
    ? cookies.map((cookie) => cookie.split(';')[0]).join('; ')
    : undefined

  await axios.get(`${url.origin}/grant/${interactId}/${nonce}`, {
    headers: {
      'x-idp-secret': idpSecret
    },
    timeout: 10_000
  })

  await axios.post(
    `${url.origin}/grant/${interactId}/${nonce}/accept`,
    {},
    {
      headers: {
        'x-idp-secret': idpSecret
      },
      timeout: 10_000
    }
  )

  const finishResponse = await axios.get(
    `${url.origin}/interact/${interactId}/${nonce}/finish`,
    {
    ...(cookieHeader
      ? {
          headers: {
            Cookie: cookieHeader
          }
        }
      : {}),
    timeout: 10_000,
    maxRedirects: 0,
    validateStatus: (status) => status >= 200 && status < 400
    }
  )

  const location = finishResponse.headers.location
  if (!location) {
    throw new Error('Interaction finish response did not include a redirect')
  }

  const finishUrl = new URL(location)
  const interactRef = finishUrl.searchParams.get('interact_ref')
  if (!interactRef) {
    throw new Error('Interaction finish redirect did not include interact_ref')
  }

  return interactRef
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
