import axios from 'axios'
import { env } from '../../config/env.js'
import type { SafaricomTokenResponse } from './safaricom.types.js'

let cachedAccessToken: string | undefined
let tokenExpiresAt = 0

export async function getSafaricomAccessToken(): Promise<string> {
  const now = Date.now()
  const refreshBufferMs = 60_000

  if (cachedAccessToken && now < tokenExpiresAt - refreshBufferMs) {
    return cachedAccessToken
  }

  const consumerKey = requireSafaricomCredential(
    'SAFARICOM_CONSUMER_KEY',
    env.SAFARICOM_CONSUMER_KEY
  )
  const consumerSecret = requireSafaricomCredential(
    'SAFARICOM_CONSUMER_SECRET',
    env.SAFARICOM_CONSUMER_SECRET
  )
  const basicToken = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
    'base64'
  )

  const response = await axios.get<SafaricomTokenResponse>(
    `${env.SAFARICOM_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: {
        Authorization: `Basic ${basicToken}`,
        Accept: 'application/json'
      }
    }
  )

  cachedAccessToken = response.data.access_token
  tokenExpiresAt = Date.now() + Number(response.data.expires_in) * 1000

  return cachedAccessToken
}

export function requireSafaricomCredential(
  name: string,
  value: string | undefined
): string {
  if (!value) throw new Error(`Missing ${name}`)
  return value
}
