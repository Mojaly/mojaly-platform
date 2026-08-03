import type { Account } from './account.types.js'

const accounts = new Map<string, Account>()

export function saveAccount(account: Account): Account {
  accounts.set(account.id, account)
  return account
}

export function getAccountById(id: string): Account | undefined {
  return accounts.get(id)
}

export function listAccounts(): Account[] {
  return Array.from(accounts.values())
}

export function listAccountsByFintech(fintechId: string): Account[] {
  return listAccounts().filter((account) => account.fintechId === fintechId)
}

export function findAccountByExternalPartnerAccount(
  partnerCode: string,
  externalPartnerAccountId: string
): Account | undefined {
  return listAccounts().find(
    (account) =>
      account.partnerCode === partnerCode &&
      account.externalPartnerAccountId === externalPartnerAccountId
  )
}
export function findAccountForFintechPartnerAsset(input: {
  fintechId: string
  partnerCode: string
  assetCode: string
  assetScale: number
}): Account | undefined {
  return listAccounts().find(
    (account) =>
      account.fintechId === input.fintechId &&
      account.partnerCode === input.partnerCode &&
      account.assetCode === input.assetCode &&
      account.assetScale === input.assetScale &&
      account.status === 'ACTIVE'
  )
}
