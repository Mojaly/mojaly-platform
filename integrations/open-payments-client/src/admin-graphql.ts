import crypto from 'node:crypto'
import https from 'node:https'
import axios from 'axios'
import { canonicalize } from 'json-canonicalize'
import { env } from './config.js'

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
})

interface GraphQlResponse<T> {
  data?: T
  errors?: Array<{ message: string }>
}

export interface AdminGraphqlCredentials {
  tenantId: string
  apiSecret: string
}

export async function adminGraphql<TData>(
  query: string,
  variables?: Record<string, unknown>,
  credentials: AdminGraphqlCredentials = {
    tenantId: env.RAFIKI_ADMIN_TENANT_ID,
    apiSecret: env.RAFIKI_ADMIN_API_SECRET
  }
): Promise<TData> {
  const body = variables ? { query, variables } : { query }
  const response = await axios.post<GraphQlResponse<TData>>(
    env.RAFIKI_ADMIN_GRAPHQL_URL,
    body,
    {
      httpsAgent,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        signature: createAdminSignature(body, credentials.apiSecret),
        'tenant-id': credentials.tenantId
      },
      timeout: 10_000
    }
  )

  if (response.data.errors?.length) {
    throw new Error(
      `Rafiki Admin GraphQL error: ${response.data.errors
        .map((error) => error.message)
        .join('; ')}`
    )
  }

  if (!response.data.data) {
    throw new Error('Rafiki Admin GraphQL returned no data')
  }

  return response.data.data
}

function createAdminSignature(body: unknown, apiSecret: string): string {
  const timestamp = Date.now()
  const payload = `${timestamp}.${canonicalize(body)}`
  const digest = crypto
    .createHmac('sha256', apiSecret)
    .update(payload)
    .digest('hex')

  return `t=${timestamp}, v${env.RAFIKI_SIGNATURE_VERSION}=${digest}`
}
