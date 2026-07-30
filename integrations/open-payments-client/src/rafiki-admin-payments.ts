import crypto from 'node:crypto'
import {
  adminGraphql,
  type AdminGraphqlCredentials
} from './admin-graphql.js'

export interface RafikiPaymentSummary {
  id: string
  type: string
  state: string
  createdAt: string
  tenant?: {
    id: string
    publicName: string
  } | null
}

export interface RafikiOutgoingPayment {
  id: string
  state: string
  error?: string | null
  receiver: string
  walletAddressId: string
  metadata?: unknown
  receiveAmount?: {
    value: string
    assetCode: string
    assetScale: number
  } | null
  debitAmount?: {
    value: string
    assetCode: string
    assetScale: number
  } | null
  sentAmount?: {
    value: string
    assetCode: string
    assetScale: number
  } | null
  liquidity?: string | null
}

export interface RafikiWebhookEventSummary {
  id: string
  type: string
  data: unknown
  createdAt: string
  tenant?: {
    id: string
    publicName: string
  } | null
}

export async function getOutgoingPayment(
  id: string,
  credentials?: AdminGraphqlCredentials
): Promise<RafikiOutgoingPayment | null> {
  const outgoingPaymentId = toAdminPaymentId(id)
  const response = await adminGraphql<{
    outgoingPayment: RafikiOutgoingPayment | null
  }>(
    `
      query GetOutgoingPayment($id: String!) {
        outgoingPayment(id: $id) {
          id
          state
          error
          receiver
          walletAddressId
          metadata
          receiveAmount {
            value
            assetCode
            assetScale
          }
          debitAmount {
            value
            assetCode
            assetScale
          }
          sentAmount {
            value
            assetCode
            assetScale
          }
          liquidity
        }
      }
    `,
    { id: outgoingPaymentId },
    credentials
  )

  return response.outgoingPayment
}

export async function depositOutgoingPaymentLiquidity(
  outgoingPaymentId: string,
  credentials?: AdminGraphqlCredentials
): Promise<boolean> {
  const adminOutgoingPaymentId = toAdminPaymentId(outgoingPaymentId)
  const response = await adminGraphql<{
    depositOutgoingPaymentLiquidity?: {
      success: boolean
    } | null
  }>(
    `
      mutation DepositOutgoingPaymentLiquidity(
        $input: DepositOutgoingPaymentLiquidityInput!
      ) {
        depositOutgoingPaymentLiquidity(input: $input) {
          success
        }
      }
    `,
    {
      input: {
        outgoingPaymentId: adminOutgoingPaymentId,
        idempotencyKey: crypto.randomUUID()
      }
    },
    credentials
  )

  return response.depositOutgoingPaymentLiquidity?.success === true
}

export async function listRecentPayments(): Promise<RafikiPaymentSummary[]> {
  const response = await adminGraphql<{
    payments: {
      edges: Array<{
        node: RafikiPaymentSummary
      }>
    }
  }>(
    `
      query ListRecentPayments {
        payments(first: 10) {
          edges {
            node {
              id
              type
              state
              createdAt
              tenant {
                id
                publicName
              }
            }
          }
        }
      }
    `
  )

  return response.payments.edges.map((edge) => edge.node)
}

export async function listRecentWebhookEvents(): Promise<
  RafikiWebhookEventSummary[]
> {
  const response = await adminGraphql<{
    webhookEvents: {
      edges: Array<{
        node: RafikiWebhookEventSummary
      }>
    }
  }>(
    `
      query ListRecentWebhookEvents {
        webhookEvents(first: 10) {
          edges {
            node {
              id
              type
              data
              createdAt
              tenant {
                id
                publicName
              }
            }
          }
        }
      }
    `
  )

  return response.webhookEvents.edges.map((edge) => edge.node)
}

function toAdminPaymentId(id: string): string {
  if (!id.startsWith('http')) {
    return id
  }

  const parsedUrl = new URL(id)
  const paymentId = parsedUrl.pathname.split('/').filter(Boolean).at(-1)

  if (!paymentId) {
    throw new Error(`Could not extract Rafiki payment id from ${id}`)
  }

  return paymentId
}
