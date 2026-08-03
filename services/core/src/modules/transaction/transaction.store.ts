import type { Transaction } from './transaction.types.js'

const transactions = new Map<string, Transaction>()

export function saveTransaction(transaction: Transaction): Transaction {
  transactions.set(transaction.id, transaction)
  return transaction
}

export function getTransactionById(id: string): Transaction | undefined {
  return transactions.get(id)
}

export function findTransactionByPaymentId(paymentId: string): Transaction | undefined {
  return listTransactions().find((transaction) => transaction.paymentId === paymentId)
}

export function listTransactions(): Transaction[] {
  return Array.from(transactions.values())
}

export function listTransactionsByAccount(accountId: string): Transaction[] {
  return listTransactions().filter((transaction) => transaction.accountId === accountId)
}

export function listTransactionsByPaymentIntent(paymentIntentId: string): Transaction[] {
  return listTransactions().filter(
    (transaction) => transaction.paymentIntentId === paymentIntentId
  )
}
