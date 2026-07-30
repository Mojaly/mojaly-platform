import { generateTestKeys } from '@interledger/http-signature-utils'
import type { KeyObject } from 'node:crypto'
import {
  adminGraphql,
  type AdminGraphqlCredentials
} from './admin-graphql.js'
import { env } from './config.js'

interface AssetNode {
  id: string
  code: string
  scale: number
  tenant: {
    id: string
  }
}

interface WalletAddressNode {
  id: string
  address: string
  publicName: string
}

interface SenderSetup {
  walletAddressUrl: string
  keyId: string
  privateKey: KeyObject
  idpSecret: string
  tenantCredentials: AdminGraphqlCredentials
}

export async function setupSenderWallet(): Promise<SenderSetup> {
  const asset = await findAsset(env.SENDER_ASSET_CODE, env.SENDER_ASSET_SCALE)
  const tenantCredentials = await findTenantCredentials(asset.tenant.id)
  const walletAddress = await findOrCreateWalletAddress(
    asset.id,
    tenantCredentials
  )
  const keys = generateTestKeys()

  await createWalletAddressKey(walletAddress.id, keys.publicKey, tenantCredentials)

  return {
    walletAddressUrl: walletAddress.address,
    keyId: keys.publicKey.kid,
    privateKey: keys.privateKey,
    idpSecret: tenantCredentials.idpSecret,
    tenantCredentials
  }
}

async function findAsset(
  code: string,
  scale: number
): Promise<AssetNode> {
  const data = await adminGraphql<{
    assets: { edges: Array<{ node: AssetNode }> }
  }>(`
    query ListAssetsForOpenPaymentsClient {
      assets(first: 100) {
        edges {
          node {
            id
            code
            scale
            tenant {
              id
            }
          }
        }
      }
    }
  `)

  const asset = data.assets.edges
    .map((edge) => edge.node)
    .find((node) => node.code === code && node.scale === scale)

  if (!asset) {
    throw new Error(`No Rafiki asset found for ${code} scale ${scale}`)
  }

  return asset
}

async function findOrCreateWalletAddress(
  assetId: string,
  credentials: AdminGraphqlCredentials
): Promise<WalletAddressNode> {
  const existingWalletAddress = await findWalletAddress(
    env.SENDER_WALLET_ADDRESS,
    credentials
  )

  if (existingWalletAddress) {
    return existingWalletAddress
  }

  const data = await adminGraphql<{
    createWalletAddress: { walletAddress: WalletAddressNode | null }
  }>(
    `
      mutation CreateOpenPaymentsClientWalletAddress(
        $input: CreateWalletAddressInput!
      ) {
        createWalletAddress(input: $input) {
          walletAddress {
            id
            address
            publicName
          }
        }
      }
    `,
    {
      input: {
        assetId,
        address: env.SENDER_WALLET_ADDRESS,
        publicName: env.SENDER_PUBLIC_NAME,
        additionalProperties: []
      }
    },
    credentials
  )

  if (!data.createWalletAddress.walletAddress) {
    throw new Error('Could not create sender wallet address')
  }

  return data.createWalletAddress.walletAddress
}

async function findWalletAddress(
  address: string,
  credentials: AdminGraphqlCredentials
): Promise<WalletAddressNode | undefined> {
  const data = await adminGraphql<{
    walletAddresses: { edges: Array<{ node: WalletAddressNode }> }
  }>(`
    query ListWalletAddressesForOpenPaymentsClient {
      walletAddresses(first: 100) {
        edges {
          node {
            id
            address
            publicName
          }
        }
      }
    }
  `,
    undefined,
    credentials
  )

  return data.walletAddresses.edges
    .map((edge) => edge.node)
    .find((node) => node.address === address)
}

async function createWalletAddressKey(
  walletAddressId: string,
  jwk: unknown,
  credentials: AdminGraphqlCredentials
): Promise<void> {
  await adminGraphql(
    `
      mutation CreateOpenPaymentsClientWalletAddressKey(
        $input: CreateWalletAddressKeyInput!
      ) {
        createWalletAddressKey(input: $input) {
          walletAddressKey {
            id
            walletAddressId
          }
        }
      }
    `,
    {
      input: {
        walletAddressId,
        jwk
      }
    },
    credentials
  )
}

async function findTenantCredentials(
  tenantId: string
): Promise<AdminGraphqlCredentials & { idpSecret: string }> {
  const data = await adminGraphql<{
    tenants: {
      edges: Array<{
        node: {
          id: string
          apiSecret: string
          idpSecret: string | null
        }
      }>
    }
  }>(`
    query ListTenantsForOpenPaymentsClient {
      tenants(first: 100) {
        edges {
          node {
            id
            apiSecret
            idpSecret
          }
        }
      }
    }
  `)

  const tenant = data.tenants.edges
    .map((edge) => edge.node)
    .find((node) => node.id === tenantId)

  if (!tenant) {
    throw new Error(`Could not find Rafiki tenant ${tenantId}`)
  }

  return {
    tenantId: tenant.id,
    apiSecret: tenant.apiSecret,
    idpSecret: tenant.idpSecret ?? ''
  }
}
