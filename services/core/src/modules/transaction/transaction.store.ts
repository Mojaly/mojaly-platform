import { query } from '../../db/postgres.js'
import type { Transaction } from './transaction.types.js'

type TransactionRow = {
  id: string
  payment_id: string
  account_id: string
  wallet_address_id: string | null
  payment_intent_id: string | null
  asset_code: string
  asset_scale: number
  value: string
  type: Transaction['type']
  status: Transaction['status']
  source: Transaction['source']
  description: string | null
  partner_reference: string | null
  created_at: Date | string
  updated_at: Date | string
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value
}

function mapTransaction(row: TransactionRow): Transaction {
  const transaction: Transaction = {
    id: row.id,
    paymentId: row.payment_id,
    accountId: row.account_id,
    assetCode: row.asset_code,
    assetScale: row.asset_scale,
    value: row.value,
    type: row.type,
    status: row.status,
    source: row.source,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  }

  if (row.wallet_address_id) {
    transaction.walletAddressId = row.wallet_address_id
  }

  if (row.payment_intent_id) {
    transaction.paymentIntentId = row.payment_intent_id
  }

  if (row.description) {
    transaction.description = row.description
  }

  if (row.partner_reference) {
    transaction.partnerReference = row.partner_reference
  }

  return transaction
}

export async function saveTransaction(
  transaction: Transaction
): Promise<Transaction> {
  const result = await query<TransactionRow>(
    `
      INSERT INTO transactions (
        id,
        payment_id,
        account_id,
        wallet_address_id,
        payment_intent_id,
        asset_code,
        asset_scale,
        value,
        type,
        status,
        source,
        description,
        partner_reference,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (id) DO UPDATE SET
        payment_id = EXCLUDED.payment_id,
        account_id = EXCLUDED.account_id,
        wallet_address_id = EXCLUDED.wallet_address_id,
        payment_intent_id = EXCLUDED.payment_intent_id,
        asset_code = EXCLUDED.asset_code,
        asset_scale = EXCLUDED.asset_scale,
        value = EXCLUDED.value,
        type = EXCLUDED.type,
        status = EXCLUDED.status,
        source = EXCLUDED.source,
        description = EXCLUDED.description,
        partner_reference = EXCLUDED.partner_reference,
        updated_at = EXCLUDED.updated_at
      RETURNING *
    `,
    [
      transaction.id,
      transaction.paymentId,
      transaction.accountId,
      transaction.walletAddressId ?? null,
      transaction.paymentIntentId ?? null,
      transaction.assetCode,
      transaction.assetScale,
      transaction.value,
      transaction.type,
      transaction.status,
      transaction.source,
      transaction.description ?? null,
      transaction.partnerReference ?? null,
      transaction.createdAt,
      transaction.updatedAt
    ]
  )

  return mapTransaction(result.rows[0]!)
}

export async function getTransactionById(
  id: string
): Promise<Transaction | undefined> {
  const result = await query<TransactionRow>(
    'SELECT * FROM transactions WHERE id = $1',
    [id]
  )
  const row = result.rows[0]
  return row ? mapTransaction(row) : undefined
}

export async function findTransactionByPaymentId(
  paymentId: string
): Promise<Transaction | undefined> {
  const result = await query<TransactionRow>(
    `
      SELECT * FROM transactions
      WHERE payment_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [paymentId]
  )
  const row = result.rows[0]
  return row ? mapTransaction(row) : undefined
}

export async function listTransactions(): Promise<Transaction[]> {
  const result = await query<TransactionRow>(
    'SELECT * FROM transactions ORDER BY created_at DESC'
  )

  return result.rows.map(mapTransaction)
}

export async function listTransactionsByAccount(
  accountId: string
): Promise<Transaction[]> {
  const result = await query<TransactionRow>(
    `
      SELECT * FROM transactions
      WHERE account_id = $1
      ORDER BY created_at DESC
    `,
    [accountId]
  )

  return result.rows.map(mapTransaction)
}

export async function listTransactionsByPaymentIntent(
  paymentIntentId: string
): Promise<Transaction[]> {
  const result = await query<TransactionRow>(
    `
      SELECT * FROM transactions
      WHERE payment_intent_id = $1
      ORDER BY created_at DESC
    `,
    [paymentIntentId]
  )

  return result.rows.map(mapTransaction)
}
