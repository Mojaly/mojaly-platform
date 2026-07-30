import type { Env } from '../../../config/env.js'
import {
  GraphQLClient,
  type RequestMiddleware,
} from 'graphql-request'
import { canonicalize } from 'json-canonicalize'
import { createHmac } from 'crypto'

function createSignedClient(endpoint: string, env: Env) {
  const middleware: RequestMiddleware = async (request) => {
    try {
      const timestamp = Date.now()
      const version = env.RAFIKI_ADMIN_SIGNATURE_VERSION

      const body =
        typeof request.body === 'string'
          ? JSON.parse(request.body)
          : request.body && typeof request.body === 'object'
            ? request.body
            : {
              query: String(request.body ?? ''),
              variables: request.variables
            }

      const payload = `${timestamp}.${canonicalize(body)}`

      const hmac = createHmac('sha256', env.RAFIKI_ADMIN_API_SECRET)
      hmac.update(payload)
      const digest = hmac.digest('hex')

      const signature = `t=${timestamp}, v${version}=${digest}`
      const headers = new Headers(request.headers)
      headers.set('signature', signature)
      headers.set('tenant-id', env.RAFIKI_OPERATOR_TENANT_ID)

      return {
        ...request,
        headers
      }
    } catch (error) {
      console.error('Failed to sign Rafiki GraphQL request', error)
      throw error
    }
  }

  return new GraphQLClient(endpoint, {
    requestMiddleware: middleware
  })
}

export function createBackendGraphQLClient(env: Env) {
  return createSignedClient(env.RAFIKI_BACKEND_GRAPHQL_URL, env)
}

export function createAuthGraphQLClient(env: Env) {
  return createSignedClient(env.RAFIKI_AUTH_GRAPHQL_URL, env)
}
