import { query } from '../../db/postgres.js'
import type { Account } from './account.types.js'

type AccountRow = {
  id: string
  workspace_id: string
  fintech_id: string
  name: string
  partner_code: string
  external_partner_account_id: string
  rafiki_asset_id: string | null
  asset_code: string
  asset_scale: number
  status: Account['status']
  created_at: Date | string
  updated_at: Date | string
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value
}

function mapAccount(row: AccountRow): Account {
  const account: Account = {
    id: row.id,
    workspaceId: row.workspace_id,
    fintechId: row.fintech_id,
    name: row.name,
    partnerCode: row.partner_code,
    externalPartnerAccountId: row.external_partner_account_id,
    assetCode: row.asset_code,
    assetScale: row.asset_scale,
    status: row.status,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  }

  if (row.rafiki_asset_id) {
    account.rafikiAssetId = row.rafiki_asset_id
  }

  return account
}

export async function saveAccount(account: Account): Promise<Account> {
  const result = await query<AccountRow>(
    `
      INSERT INTO accounts (
        id,
        workspace_id,
        fintech_id,
        name,
        partner_code,
        external_partner_account_id,
        rafiki_asset_id,
        asset_code,
        asset_scale,
        status,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        workspace_id = EXCLUDED.workspace_id,
        fintech_id = EXCLUDED.fintech_id,
        name = EXCLUDED.name,
        partner_code = EXCLUDED.partner_code,
        external_partner_account_id = EXCLUDED.external_partner_account_id,
        rafiki_asset_id = EXCLUDED.rafiki_asset_id,
        asset_code = EXCLUDED.asset_code,
        asset_scale = EXCLUDED.asset_scale,
        status = EXCLUDED.status,
        updated_at = EXCLUDED.updated_at
      RETURNING *
    `,
    [
      account.id,
      account.workspaceId,
      account.fintechId,
      account.name,
      account.partnerCode,
      account.externalPartnerAccountId,
      account.rafikiAssetId ?? null,
      account.assetCode,
      account.assetScale,
      account.status,
      account.createdAt,
      account.updatedAt
    ]
  )

  return mapAccount(result.rows[0]!)
}

export async function getAccountById(id: string): Promise<Account | undefined> {
  const result = await query<AccountRow>('SELECT * FROM accounts WHERE id = $1', [id])
  const row = result.rows[0]
  return row ? mapAccount(row) : undefined
}

export async function listAccounts(): Promise<Account[]> {
  const result = await query<AccountRow>('SELECT * FROM accounts ORDER BY created_at DESC')
  return result.rows.map(mapAccount)
}

export async function listAccountsByWorkspace(workspaceId: string): Promise<Account[]> {
  const result = await query<AccountRow>(
    'SELECT * FROM accounts WHERE workspace_id = $1 ORDER BY created_at DESC',
    [workspaceId]
  )
  return result.rows.map(mapAccount)
}

export async function listAccountsByFintech(fintechId: string): Promise<Account[]> {
  const result = await query<AccountRow>(
    'SELECT * FROM accounts WHERE fintech_id = $1 ORDER BY created_at DESC',
    [fintechId]
  )
  return result.rows.map(mapAccount)
}

export async function findAccountByExternalPartnerAccount(
  partnerCode: string,
  externalPartnerAccountId: string
): Promise<Account | undefined> {
  const result = await query<AccountRow>(
    `
      SELECT * FROM accounts
      WHERE partner_code = $1 AND external_partner_account_id = $2
      LIMIT 1
    `,
    [partnerCode, externalPartnerAccountId]
  )
  const row = result.rows[0]
  return row ? mapAccount(row) : undefined
}

export async function findAccountForFintechPartnerAsset(input: {
  fintechId: string
  partnerCode: string
  assetCode: string
  assetScale: number
}): Promise<Account | undefined> {
  const result = await query<AccountRow>(
    `
      SELECT * FROM accounts
      WHERE fintech_id = $1
        AND partner_code = $2
        AND asset_code = $3
        AND asset_scale = $4
        AND status = 'ACTIVE'
      LIMIT 1
    `,
    [input.fintechId, input.partnerCode, input.assetCode, input.assetScale]
  )
  const row = result.rows[0]
  return row ? mapAccount(row) : undefined
}
