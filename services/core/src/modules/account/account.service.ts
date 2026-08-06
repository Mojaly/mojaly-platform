import { randomUUID } from 'node:crypto'
import { getPartnerAccountBalance } from '../../clients/partner-adapter.client.js'
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
    assetScale: input.assetScale,
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now
  }

  if (input.rafikiAssetId) {
    account.rafikiAssetId = input.rafikiAssetId
  }

  return saveAccount(account)
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
