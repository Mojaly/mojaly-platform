import { randomUUID } from 'node:crypto'
import { getPartnerAccountBalance } from '../../clients/partner-adapter.client.js'
import {
  getPartnerAccountLinkOptions,
  PartnerSupportedAssetNotFoundError,
  resolvePartnerSupportedAsset
} from '../partner-routing/partner-routing.service.js'
import { getWorkspace } from '../workspaces/workspace.service.js'
import {
  getAccountById,
  listAccounts,
  listAccountsByFintech,
  listAccountsByWorkspace,
  saveAccount
} from './account.store.js'
import type { Account, CreateAccountInput } from './account.types.js'

export async function createAccount(input: CreateAccountInput): Promise<Account> {
  const workspaceId = input.workspaceId ?? input.fintechId

  if (!workspaceId) {
    throw new Error('ACCOUNT_WORKSPACE_REQUIRED')
  }

  if (input.workspaceId) {
    const workspace = await getWorkspace(input.workspaceId)

    if (!workspace) {
      throw new Error('WORKSPACE_NOT_FOUND')
    }

    if (workspace.status !== 'ACTIVE') {
      throw new Error('WORKSPACE_NOT_ACTIVE')
    }
  }

  const supportedAsset = await resolveSupportedAccountAsset({
    partnerCode: input.partnerCode,
    assetCode: input.assetCode
  })

  const rafikiAssetId = input.rafikiAssetId ?? supportedAsset.rafikiAssetId
  const assetScale = input.assetScale ?? supportedAsset.assetScale

  const now = new Date().toISOString()

  const account: Account = {
    id: randomUUID(),
    workspaceId,
    // fintechId is kept as a compatibility alias until older flows move fully to workspaceId.
    fintechId: workspaceId,
    name: input.name,
    partnerCode: input.partnerCode,
    externalPartnerAccountId: input.externalPartnerAccountId,
    assetCode: input.assetCode,
    assetScale,
    rafikiAssetId,
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now
  }

  return saveAccount(account)
}

async function resolveSupportedAccountAsset(input: {
  partnerCode: string
  assetCode: string
}) {
  try {
    return await resolvePartnerSupportedAsset(input)
  } catch (error) {
    if (error instanceof PartnerSupportedAssetNotFoundError) {
      throw new Error('PARTNER_ASSET_NOT_FOUND')
    }

    throw error
  }
}

export async function getWorkspaceAccountLinkOptions(workspaceId: string) {
  const workspace = await getWorkspace(workspaceId)

  if (!workspace) {
    throw new Error('WORKSPACE_NOT_FOUND')
  }

  if (workspace.status !== 'ACTIVE') {
    throw new Error('WORKSPACE_NOT_ACTIVE')
  }

  return getPartnerAccountLinkOptions()
}

export async function getAccount(id: string): Promise<Account | undefined> {
  return getAccountById(id)
}

export async function getAccounts(): Promise<Account[]> {
  return listAccounts()
}

export async function getWorkspaceAccounts(workspaceId: string): Promise<Account[]> {
  return listAccountsByWorkspace(workspaceId)
}

export async function getFintechAccounts(fintechId: string): Promise<Account[]> {
  return listAccountsByFintech(fintechId)
}

export async function getAccountBalance(id: string) {
  const account = await getAccountById(id)

  if (!account) {
    throw new Error('ACCOUNT_NOT_FOUND')
  }

  // Like Testnet asks its backing provider, Mojaly asks the backing partner for spend capacity.
  const balanceResponse = await getPartnerAccountBalance({
    partnerCode: account.partnerCode,
    externalAccountId: account.externalPartnerAccountId,
    assetCode: account.assetCode,
    assetScale: account.assetScale
  })

  return {
    account,
    balance: balanceResponse.data
  }
}
