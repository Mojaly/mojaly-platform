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
  const account = getAccount(input.accountId)

  if (!account) {
    throw new Error('ACCOUNT_NOT_FOUND')
  }

  if (account.status !== 'ACTIVE') {
    throw new Error('ACCOUNT_INACTIVE')
  }

  if (!account.rafikiAssetId) {
    throw new Error('ACCOUNT_RAFIKI_ASSET_MISSING')
  }

  const url = buildWalletAddressUrl(account.partnerCode, input.walletAddressName)

  if (getWalletAddressByUrl(url)) {
    throw new Error('WALLET_ADDRESS_ALREADY_EXISTS')
  }

  const partner = findRoutingPartnerByAdapterCode(account.partnerCode)

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

export function getWalletAddress(id: string): WalletAddress | undefined {
  return getWalletAddressById(id)
}

export function getWalletAddresses(): WalletAddress[] {
  return listWalletAddresses()
}

export function getAccountWalletAddresses(accountId: string): WalletAddress[] {
  return listWalletAddressesByAccount(accountId)
}

export function getFintechWalletAddresses(fintechId: string): WalletAddress[] {
  return listWalletAddressesByFintech(fintechId)
}