import { env } from '../../config/env.js'
import type { KratosSession } from './auth.types.js'

export class KratosAuthError extends Error {
  constructor(message = 'Invalid Kratos session') {
    super(message)
  }
}

export async function getKratosSession(input: {
  cookie?: string
  sessionToken?: string
}): Promise<KratosSession> {
  const headers = new Headers({ Accept: 'application/json' })

  if (input.cookie) {
    headers.set('Cookie', input.cookie)
  }

  if (input.sessionToken) {
    headers.set('X-Session-Token', input.sessionToken)
  }

  const response = await fetch(`${env.KRATOS_PUBLIC_URL.replace(/\/$/, '')}/sessions/whoami`, {
    method: 'GET',
    headers
  })

  if (response.status === 401 || response.status === 403) {
    throw new KratosAuthError()
  }

  if (!response.ok) {
    throw new Error(`Kratos whoami failed with status ${response.status}`)
  }

  return response.json() as Promise<KratosSession>
}