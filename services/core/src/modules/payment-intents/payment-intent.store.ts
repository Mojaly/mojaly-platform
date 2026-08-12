import { query } from '../../db/postgres.js'
import type {
  PaymentDestination,
  PaymentIntent
} from './payment-intent.types.js'

type PaymentIntentRow = {
  id: string
  workspace_id: string | null
  fintech_id: string
  account_id: string | null
  partner_code: string
  destination_type: PaymentDestination['type']
  destination_country: string
  destination_account: string
  destination_bank_code: string | null
  destination_network: string | null
  destination_name: string | null
  amount_value: string
  amount_asset_code: string
  amount_asset_scale: number
  reference: string
  wallet_address: string
  status: PaymentIntent['status']
  adapter_payout_id: string | null
  failure_reason: string | null
  expires_at: Date | string
  created_at: Date | string
  updated_at: Date | string
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value
}

function mapPaymentIntent(row: PaymentIntentRow): PaymentIntent {
  const destination: PaymentDestination = {
    type: row.destination_type,
    country: row.destination_country,
    account: row.destination_account
  }

  if (row.destination_bank_code) {
    destination.bankCode = row.destination_bank_code
  }

  if (row.destination_network) {
    destination.network = row.destination_network
  }

  if (row.destination_name) {
    destination.name = row.destination_name
  }

  const intent: PaymentIntent = {
    id: row.id,
    fintechId: row.fintech_id,
    partnerCode: row.partner_code,
    destination,
    amount: {
      value: row.amount_value,
      assetCode: row.amount_asset_code,
      assetScale: row.amount_asset_scale
    },
    reference: row.reference,
    walletAddress: row.wallet_address,
    status: row.status,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    expiresAt: toIso(row.expires_at)
  }

  if (row.workspace_id) {
    intent.workspaceId = row.workspace_id
  }

  if (row.account_id) {
    intent.accountId = row.account_id
  }

  if (row.adapter_payout_id) {
    intent.adapterPayoutId = row.adapter_payout_id
  }

  if (row.failure_reason) {
    intent.failureReason = row.failure_reason
  }

  return intent
}

export async function savePaymentIntent(
  intent: PaymentIntent
): Promise<PaymentIntent> {
  const result = await query<PaymentIntentRow>(
    `
      INSERT INTO payment_intents (
        id,
        workspace_id,
        fintech_id,
        account_id,
        partner_code,
        destination_type,
        destination_country,
        destination_account,
        destination_bank_code,
        destination_network,
        destination_name,
        amount_value,
        amount_asset_code,
        amount_asset_scale,
        reference,
        wallet_address,
        status,
        adapter_payout_id,
        failure_reason,
        expires_at,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20,
        $21, $22
      )
      ON CONFLICT (id) DO UPDATE SET
        workspace_id = EXCLUDED.workspace_id,
        fintech_id = EXCLUDED.fintech_id,
        account_id = EXCLUDED.account_id,
        partner_code = EXCLUDED.partner_code,
        destination_type = EXCLUDED.destination_type,
        destination_country = EXCLUDED.destination_country,
        destination_account = EXCLUDED.destination_account,
        destination_bank_code = EXCLUDED.destination_bank_code,
        destination_network = EXCLUDED.destination_network,
        destination_name = EXCLUDED.destination_name,
        amount_value = EXCLUDED.amount_value,
        amount_asset_code = EXCLUDED.amount_asset_code,
        amount_asset_scale = EXCLUDED.amount_asset_scale,
        reference = EXCLUDED.reference,
        wallet_address = EXCLUDED.wallet_address,
        status = EXCLUDED.status,
        adapter_payout_id = EXCLUDED.adapter_payout_id,
        failure_reason = EXCLUDED.failure_reason,
        expires_at = EXCLUDED.expires_at,
        updated_at = EXCLUDED.updated_at
      RETURNING *
    `,
    [
      intent.id,
      intent.workspaceId ?? null,
      intent.fintechId,
      intent.accountId ?? null,
      intent.partnerCode,
      intent.destination.type,
      intent.destination.country,
      intent.destination.account,
      intent.destination.bankCode ?? null,
      intent.destination.network ?? null,
      intent.destination.name ?? null,
      intent.amount.value,
      intent.amount.assetCode,
      intent.amount.assetScale,
      intent.reference,
      intent.walletAddress,
      intent.status,
      intent.adapterPayoutId ?? null,
      intent.failureReason ?? null,
      intent.expiresAt,
      intent.createdAt,
      intent.updatedAt
    ]
  )

  return mapPaymentIntent(result.rows[0]!)
}

export async function getPaymentIntentById(
  id: string
): Promise<PaymentIntent | undefined> {
  const result = await query<PaymentIntentRow>(
    'SELECT * FROM payment_intents WHERE id = $1',
    [id]
  )
  const row = result.rows[0]
  return row ? mapPaymentIntent(row) : undefined
}

export async function getPaymentIntentByWalletAddress(
  walletAddress: string
): Promise<PaymentIntent | undefined> {
  const result = await query<PaymentIntentRow>(
    `
      SELECT * FROM payment_intents
      WHERE wallet_address = $1
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [walletAddress]
  )
  const row = result.rows[0]
  return row ? mapPaymentIntent(row) : undefined
}

export async function listPaymentIntents(): Promise<PaymentIntent[]> {
  const result = await query<PaymentIntentRow>(
    'SELECT * FROM payment_intents ORDER BY created_at DESC'
  )

  return result.rows.map(mapPaymentIntent)
}

export async function updatePaymentIntent(
  id: string,
  updates: Partial<Omit<PaymentIntent, 'id' | 'createdAt'>>
): Promise<PaymentIntent | undefined> {
  const existing = await getPaymentIntentById(id)

  if (!existing) {
    return undefined
  }

  const updated: PaymentIntent = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  }

  return savePaymentIntent(updated)
}
