import { query } from '../../db/postgres.js'
import type { Payout } from './payout.types.js'

type PayoutRow = {
  id: string
  payment_id: string
  partner_code: string
  amount: string
  asset_code: string
  asset_scale: number
  destination_type: Payout['destinationType']
  destination_account: string
  destination_bank_code: string | null
  customer_name: string | null
  reference: string
  status: Payout['status']
  partner_reference: string | null
  failure_reason: string | null
  created_at: Date | string
  updated_at: Date | string
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value
}

function mapPayout(row: PayoutRow): Payout {
  const payout: Payout = {
    id: row.id,
    paymentId: row.payment_id,
    partnerCode: row.partner_code,
    amount: row.amount,
    assetCode: row.asset_code,
    assetScale: row.asset_scale,
    destinationType: row.destination_type,
    destinationAccount: row.destination_account,
    reference: row.reference,
    status: row.status,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  }

  if (row.destination_bank_code) {
    payout.destinationBankCode = row.destination_bank_code
  }

  if (row.customer_name) {
    payout.customerName = row.customer_name
  }

  if (row.partner_reference) {
    payout.partnerReference = row.partner_reference
  }

  if (row.failure_reason) {
    payout.failureReason = row.failure_reason
  }

  return payout
}

export async function savePayout(payout: Payout): Promise<Payout> {
  const result = await query<PayoutRow>(
    `
      INSERT INTO partner_payouts (
        id,
        payment_id,
        partner_code,
        amount,
        asset_code,
        asset_scale,
        destination_type,
        destination_account,
        destination_bank_code,
        customer_name,
        reference,
        status,
        partner_reference,
        failure_reason,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (id) DO UPDATE SET
        payment_id = EXCLUDED.payment_id,
        partner_code = EXCLUDED.partner_code,
        amount = EXCLUDED.amount,
        asset_code = EXCLUDED.asset_code,
        asset_scale = EXCLUDED.asset_scale,
        destination_type = EXCLUDED.destination_type,
        destination_account = EXCLUDED.destination_account,
        destination_bank_code = EXCLUDED.destination_bank_code,
        customer_name = EXCLUDED.customer_name,
        reference = EXCLUDED.reference,
        status = EXCLUDED.status,
        partner_reference = EXCLUDED.partner_reference,
        failure_reason = EXCLUDED.failure_reason,
        updated_at = EXCLUDED.updated_at
      RETURNING *
    `,
    [
      payout.id,
      payout.paymentId,
      payout.partnerCode,
      payout.amount,
      payout.assetCode,
      payout.assetScale,
      payout.destinationType,
      payout.destinationAccount,
      payout.destinationBankCode ?? null,
      payout.customerName ?? null,
      payout.reference,
      payout.status,
      payout.partnerReference ?? null,
      payout.failureReason ?? null,
      payout.createdAt,
      payout.updatedAt
    ]
  )

  return mapPayout(result.rows[0]!)
}

export async function getPayoutById(id: string): Promise<Payout | undefined> {
  const result = await query<PayoutRow>(
    'SELECT * FROM partner_payouts WHERE id = $1',
    [id]
  )
  const row = result.rows[0]
  return row ? mapPayout(row) : undefined
}

export async function listPayouts(): Promise<Payout[]> {
  const result = await query<PayoutRow>(
    'SELECT * FROM partner_payouts ORDER BY created_at DESC'
  )

  return result.rows.map(mapPayout)
}

export async function updatePayout(
  id: string,
  updates: Partial<Omit<Payout, 'id' | 'createdAt'>>
): Promise<Payout | undefined> {
  const existing = await getPayoutById(id)

  if (!existing) {
    return undefined
  }

  const updated: Payout = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  }

  return savePayout(updated)
}

export async function getPayoutByReference(
  reference: string
): Promise<Payout | undefined> {
  const result = await query<PayoutRow>(
    `
      SELECT * FROM partner_payouts
      WHERE reference = $1
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [reference]
  )
  const row = result.rows[0]
  return row ? mapPayout(row) : undefined
}

export async function getPayoutByPartnerReference(
  partnerReference: string
): Promise<Payout | undefined> {
  const result = await query<PayoutRow>(
    `
      SELECT * FROM partner_payouts
      WHERE partner_reference = $1
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [partnerReference]
  )
  const row = result.rows[0]
  return row ? mapPayout(row) : undefined
}
