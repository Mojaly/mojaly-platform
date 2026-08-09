import { query } from '../../db/postgres.js'
import type { WalletAddress } from './wallet-address.types.js'

type WalletAddressRow = {
  id: string
  account_id: string
  workspace_id: string
  fintech_id: string
  url: string
  public_name: string
  asset_code: string
  asset_scale: number
  rafiki_asset_id: string
  status: WalletAddress['status']
  created_at: Date | string
  updated_at: Date | string
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value
}

function mapWalletAddress(row: WalletAddressRow): WalletAddress {
  return {
    id: row.id,
    accountId: row.account_id,
    workspaceId: row.workspace_id,
    fintechId: row.fintech_id,
    url: row.url,
    publicName: row.public_name,
    assetCode: row.asset_code,
    assetScale: row.asset_scale,
    rafikiAssetId: row.rafiki_asset_id,
    status: row.status,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  }
}

export async function saveWalletAddress(
  walletAddress: WalletAddress
): Promise<WalletAddress> {
  const result = await query<WalletAddressRow>(
    `
      INSERT INTO wallet_addresses (
        id,
        account_id,
        workspace_id,
        fintech_id,
        url,
        public_name,
        asset_code,
        asset_scale,
        rafiki_asset_id,
        status,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        account_id = EXCLUDED.account_id,
        workspace_id = EXCLUDED.workspace_id,
        fintech_id = EXCLUDED.fintech_id,
        url = EXCLUDED.url,
        public_name = EXCLUDED.public_name,
        asset_code = EXCLUDED.asset_code,
        asset_scale = EXCLUDED.asset_scale,
        rafiki_asset_id = EXCLUDED.rafiki_asset_id,
        status = EXCLUDED.status,
        updated_at = EXCLUDED.updated_at
      RETURNING *
    `,
    [
      walletAddress.id,
      walletAddress.accountId,
      walletAddress.workspaceId,
      walletAddress.fintechId,
      walletAddress.url,
      walletAddress.publicName,
      walletAddress.assetCode,
      walletAddress.assetScale,
      walletAddress.rafikiAssetId,
      walletAddress.status,
      walletAddress.createdAt,
      walletAddress.updatedAt
    ]
  )

  return mapWalletAddress(result.rows[0]!)
}

export async function getWalletAddressById(
  id: string
): Promise<WalletAddress | undefined> {
  const result = await query<WalletAddressRow>(
    'SELECT * FROM wallet_addresses WHERE id = $1',
    [id]
  )
  const row = result.rows[0]
  return row ? mapWalletAddress(row) : undefined
}

export async function getWalletAddressByUrl(
  url: string
): Promise<WalletAddress | undefined> {
  const result = await query<WalletAddressRow>(
    'SELECT * FROM wallet_addresses WHERE url = $1',
    [url]
  )
  const row = result.rows[0]
  return row ? mapWalletAddress(row) : undefined
}

export async function listWalletAddresses(): Promise<WalletAddress[]> {
  const result = await query<WalletAddressRow>(
    'SELECT * FROM wallet_addresses ORDER BY created_at DESC'
  )

  return result.rows.map(mapWalletAddress)
}

export async function listWalletAddressesByAccount(
  accountId: string
): Promise<WalletAddress[]> {
  const result = await query<WalletAddressRow>(
    `
      SELECT * FROM wallet_addresses
      WHERE account_id = $1
      ORDER BY created_at DESC
    `,
    [accountId]
  )

  return result.rows.map(mapWalletAddress)
}

export async function listWalletAddressesByWorkspace(
  workspaceId: string
): Promise<WalletAddress[]> {
  const result = await query<WalletAddressRow>(
    `
      SELECT * FROM wallet_addresses
      WHERE workspace_id = $1
      ORDER BY created_at DESC
    `,
    [workspaceId]
  )

  return result.rows.map(mapWalletAddress)
}

export async function listWalletAddressesByFintech(
  fintechId: string
): Promise<WalletAddress[]> {
  const result = await query<WalletAddressRow>(
    `
      SELECT * FROM wallet_addresses
      WHERE fintech_id = $1
      ORDER BY created_at DESC
    `,
    [fintechId]
  )

  return result.rows.map(mapWalletAddress)
}
