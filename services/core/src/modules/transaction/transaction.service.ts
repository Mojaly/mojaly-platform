import { randomUUID } from 'node:crypto'
import { getAccountById } from '../account/account.store.js'
import {
  findTransactionByPaymentId,
  getTransactionById,
  listTransactions,
  listTransactionsByAccount,
  listTransactionsByPaymentIntent,
  saveTransaction
} from './transaction.store.js'
import type {
  CreateTransactionInput,
  Transaction,
  UpdateTransactionStatusInput
} from './transaction.types.js'

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const account = await getAccountById(input.accountId)

  if (!account) {
    throw new Error('ACCOUNT_NOT_FOUND')
  }

  const existing = await findTransactionByPaymentId(input.paymentId)

  if (existing) {
    return existing
  }

  const now = new Date().toISOString()
  const transaction: Transaction = {
    id: randomUUID(),
    paymentId: input.paymentId,
    accountId: input.accountId,
    assetCode: input.assetCode,
    assetScale: input.assetScale,
    value: input.value,
    type: input.type,
    status: input.status ?? 'PENDING',
    source: input.source,
    createdAt: now,
    updatedAt: now
  }

  if (input.walletAddressId) {
    transaction.walletAddressId = input.walletAddressId
  }

  if (input.paymentIntentId) {
    transaction.paymentIntentId = input.paymentIntentId
  }

  if (input.description) {
    transaction.description = input.description
  }

  if (input.partnerReference) {
    transaction.partnerReference = input.partnerReference
  }

  return saveTransaction(transaction)
}

export async function getTransaction(id: string): Promise<Transaction | undefined> {
  return getTransactionById(id)
}

export async function getTransactions(): Promise<Transaction[]> {
  return listTransactions()
}

export async function getAccountTransactions(accountId: string): Promise<Transaction[]> {
  return listTransactionsByAccount(accountId)
}

export async function getPaymentIntentTransactions(paymentIntentId: string): Promise<Transaction[]> {
  return listTransactionsByPaymentIntent(paymentIntentId)
}

export async function updateTransactionStatus(
  id: string,
  input: UpdateTransactionStatusInput
): Promise<Transaction | undefined> {
  const transaction = await getTransactionById(id)

  if (!transaction) {
    return undefined
  }

  const updated: Transaction = {
    ...transaction,
    status: input.status,
    updatedAt: new Date().toISOString()
  }

  if (input.partnerReference) {
    updated.partnerReference = input.partnerReference
  }

  if (input.description) {
    updated.description = input.description
  }

  return saveTransaction(updated)
}

