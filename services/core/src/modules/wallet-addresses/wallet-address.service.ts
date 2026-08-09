import { env } from '../../config/env.js'
import { getAccount } from '../account/account.service.js'
import { findRoutingPartnerByAdapterCode } from '../partner-routing/partner-routing.store.js'
import { createRafikiClient } from '../rafiki/rafiki.factory.js'
import {
  getWalletAddressById,
  getWalletAddressByUrl,
  listWalletAddresses,
  listWalletAddressesByAccount,
  listWalletAddressesByFintech,
  listWalletAddressesByWorkspace,
  saveWalletAddress
} from './wallet-address.store.js'
import type {
  CreateWalletAddressInput,
  WalletAddress
} from './wallet-address.types.js'

function buildWalletAddressUrl(
  partnerCode: string,
  walletAddressName: string
): string {
  const baseUrl = env.MOJALY_OPEN_PAYMENTS_HOST.replace(/\/$/, '')
  const partnerPath = partnerCode.toLowerCase().replaceAll('_', '-')

  // Rafiki/Open Payments wallet address identifiers must be HTTPS URLs and
  // must sit under the wallet address URL configured for the owning tenant.
  return `${baseUrl.replace(/^http:\/\//, 'https://')}/${partnerPath}/${walletAddressName}`
}

export async function createWalletAddress(
  input: CreateWalletAddressInput
): Promise<WalletAddress> {
  const account = await getAccount(input.accountId)

  if (!account) {
    throw new Error('ACCOUNT_NOT_FOUND')
  }

  if (input.workspaceId && account.workspaceId !== input.workspaceId) {
    throw new Error('ACCOUNT_WORKSPACE_MISMATCH')
  }

  if (account.status !== 'ACTIVE') {
    throw new Error('ACCOUNT_INACTIVE')
  }

  if (!account.rafikiAssetId) {
    throw new Error('ACCOUNT_RAFIKI_ASSET_MISSING')
  }

  const url = buildWalletAddressUrl(account.partnerCode, input.walletAddressName)

  if (await getWalletAddressByUrl(url)) {
    throw new Error('WALLET_ADDRESS_ALREADY_EXISTS')
  }

  const partner = await findRoutingPartnerByAdapterCode(account.partnerCode)

  if (!partner) {
    throw new Error('PARTNER_ROUTE_NOT_FOUND')
  }

  const rafikiClient = createRafikiClient()
  const rafikiWalletAddress = await rafikiClient.createRafikiWalletAddress(
    input.publicName,
    account.rafikiAssetId,
    url,
    partner.rafikiTenantId
  )

  const now = new Date().toISOString()
  const walletAddress: WalletAddress = {
    id: rafikiWalletAddress.id,
    accountId: account.id,
    workspaceId: account.workspaceId,
    fintechId: account.fintechId,
    url: rafikiWalletAddress.address,
    publicName: input.publicName,
    assetCode: account.assetCode,
    assetScale: account.assetScale,
    rafikiAssetId: account.rafikiAssetId,
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now
  }

  return saveWalletAddress(walletAddress)
}

export async function getWalletAddress(id: string): Promise<WalletAddress | undefined> {
  return getWalletAddressById(id)
}

export async function getWalletAddresses(): Promise<WalletAddress[]> {
  return listWalletAddresses()
}

export async function getAccountWalletAddresses(accountId: string): Promise<WalletAddress[]> {
  return listWalletAddressesByAccount(accountId)
}

export async function getWorkspaceWalletAddresses(
  workspaceId: string
): Promise<WalletAddress[]> {
  return listWalletAddressesByWorkspace(workspaceId)
}

export async function getFintechWalletAddresses(fintechId: string): Promise<WalletAddress[]> {
  return listWalletAddressesByFintech(fintechId)
}

