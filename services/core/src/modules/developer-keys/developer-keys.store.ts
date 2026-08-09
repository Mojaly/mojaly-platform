import { query } from '../../db/postgres.js'
import type { DeveloperKey } from './developer-keys.types.js'

type DeveloperKeyRow = {
  id: string
  name: string
  workspace_id: string
  wallet_address_id: string
  rafiki_id: string
  public_key: string
  status: DeveloperKey['status']
  revoked_at: Date | string | null
  created_at: Date | string
  updated_at: Date | string
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value
}

function mapDeveloperKey(row: DeveloperKeyRow): DeveloperKey {
  return {
    id: row.id,
    name: row.name,
    workspaceId: row.workspace_id,
    walletAddressId: row.wallet_address_id,
    rafikiId: row.rafiki_id,
    publicKey: row.public_key,
    status: row.status,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  }
}

export async function saveDeveloperKey(key: DeveloperKey): Promise<DeveloperKey> {
  const result = await query<DeveloperKeyRow>(
    `
      INSERT INTO developer_keys (
        id,
        name,
        workspace_id,
        wallet_address_id,
        rafiki_id,
        public_key,
        status,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        workspace_id = EXCLUDED.workspace_id,
        wallet_address_id = EXCLUDED.wallet_address_id,
        rafiki_id = EXCLUDED.rafiki_id,
        public_key = EXCLUDED.public_key,
        status = EXCLUDED.status,
        updated_at = EXCLUDED.updated_at
      RETURNING *
    `,
    [
      key.id,
      key.name,
      key.workspaceId,
      key.walletAddressId,
      key.rafikiId,
      key.publicKey,
      key.status,
      key.createdAt,
      key.updatedAt
    ]
  )

  return mapDeveloperKey(result.rows[0]!)
}

export async function getDeveloperKeyById(
  id: string
): Promise<DeveloperKey | undefined> {
  const result = await query<DeveloperKeyRow>(
    'SELECT * FROM developer_keys WHERE id = $1',
    [id]
  )
  const row = result.rows[0]
  return row ? mapDeveloperKey(row) : undefined
}

export async function listDeveloperKeysByWorkspace(
  workspaceId: string
): Promise<DeveloperKey[]> {
  const result = await query<DeveloperKeyRow>(
    `
      SELECT * FROM developer_keys
      WHERE workspace_id = $1
      ORDER BY created_at DESC
    `,
    [workspaceId]
  )

  return result.rows.map(mapDeveloperKey)
}

export async function listDeveloperKeysByWalletAddress(
  walletAddressId: string
): Promise<DeveloperKey[]> {
  const result = await query<DeveloperKeyRow>(
    `
      SELECT * FROM developer_keys
      WHERE wallet_address_id = $1
      ORDER BY created_at DESC
    `,
    [walletAddressId]
  )

  return result.rows.map(mapDeveloperKey)
}

export async function updateDeveloperKey(
  id: string,
  updates: Partial<Omit<DeveloperKey, 'id' | 'createdAt'>>
): Promise<DeveloperKey | undefined> {
  const existing = await getDeveloperKeyById(id)

  if (!existing) {
    return undefined
  }

  const updated: DeveloperKey = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  }

  const result = await query<DeveloperKeyRow>(
    `
      UPDATE developer_keys
      SET
        name = $2,
        workspace_id = $3,
        wallet_address_id = $4,
        rafiki_id = $5,
        public_key = $6,
        status = $7,
        revoked_at = CASE WHEN $7 = 'REVOKED' THEN now() ELSE revoked_at END,
        updated_at = $8
      WHERE id = $1
      RETURNING *
    `,
    [
      id,
      updated.name,
      updated.workspaceId,
      updated.walletAddressId,
      updated.rafikiId,
      updated.publicKey,
      updated.status,
      updated.updatedAt
    ]
  )

  const row = result.rows[0]
  return row ? mapDeveloperKey(row) : undefined
}
