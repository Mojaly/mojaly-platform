import axios from 'axios'
import { env } from '../../config/env.js'
import type { KcbTokenResponse } from './kcb.types.js'

let cachedAccessToken: string | null = null
let tokenExpiresAt = 0

function requireKcbCredential(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing ${name}`)
  }

  return value
}

async function requestAccessToken(): Promise<KcbTokenResponse> {
  const consumerKey = requireKcbCredential(
    'KCB_CONSUMER_KEY',
    env.KCB_CONSUMER_KEY
  )

  const consumerSecret = requireKcbCredential(
    'KCB_CONSUMER_SECRET',
    env.KCB_CONSUMER_SECRET
  )

  const basicToken = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
    'base64'
  )

  const tokenUrl = `${env.KCB_AUTH_URL}/token?grant_type=client_credentials`

  const response = await axios.post<KcbTokenResponse>(
    tokenUrl,
    undefined,
    {
      headers: {
        Authorization: `Basic ${basicToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    }
  )

  return response.data
}

export async function getKcbAccessToken(): Promise<string> {
  const now = Date.now()
  const refreshBufferMs = 60_000

  if (cachedAccessToken && now < tokenExpiresAt - refreshBufferMs) {
    return cachedAccessToken
  }

  const tokenResponse = await requestAccessToken()

  cachedAccessToken = tokenResponse.access_token
  tokenExpiresAt = Date.now() + tokenResponse.expires_in * 1000

  console.log({token:cachedAccessToken})
  return cachedAccessToken
}