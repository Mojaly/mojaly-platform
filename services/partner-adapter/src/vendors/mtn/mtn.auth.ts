import axios from 'axios'
import { env } from '../../config/env.js'
import type { MtnTokenResponse } from './mtn.types.js'

let cachedAccessToken: string | undefined
let tokenExpiresAt = 0

export async function getMtnAccessToken(): Promise<string> {
  const now = Date.now()
  const refreshBufferMs = 60_000

  if (cachedAccessToken && now < tokenExpiresAt - refreshBufferMs) {
    return cachedAccessToken
  }

  const apiUser = requireMtnCredential('MTN_API_USER', env.MTN_API_USER)
  const apiKey = requireMtnCredential('MTN_API_KEY', env.MTN_API_KEY)
  const subscriptionKey = requireMtnCredential(
    'MTN_SUBSCRIPTION_KEY',
    env.MTN_SUBSCRIPTION_KEY
  )
  const basicToken = Buffer.from(`${apiUser}:${apiKey}`).toString('base64')

  const response = await axios.post<MtnTokenResponse>(
    `${env.MTN_BASE_URL}/disbursement/token/`,
    undefined,
    {
      headers: {
        Authorization: `Basic ${basicToken}`,
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        Accept: 'application/json'
      }
    }
  )

  cachedAccessToken = response.data.access_token
  tokenExpiresAt = Date.now() + response.data.expires_in * 1000

  return cachedAccessToken
}

function requireMtnCredential(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing ${name}`)
  return value
}
