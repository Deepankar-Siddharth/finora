import type { Transaction } from '../types'
import { monthKeyOf } from './dates'

export function sumIncome(transactions: Transaction[]): number {
  return transactions.reduce(
    (sum, t) => (t.type === 'income' ? sum + t.amount : sum),
    0,
  )
}

export function sumExpenses(transactions: Transaction[]): number {
  return transactions.reduce(
    (sum, t) => (t.type === 'expense' ? sum + t.amount : sum),
    0,
  )
}

export function getIncome(transactions: Transaction[]): number {
  return sumIncome(transactions)
}

export function getExpenses(transactions: Transaction[]): number {
  return sumExpenses(transactions)
}

/** All-time net position: income minus expenses. */
export function getBalance(transactions: Transaction[]): number {
  return sumIncome(transactions) - sumExpenses(transactions)
}

export function getSavings(transactions: Transaction[]): number {
  return getBalance(transactions)
}

/** Savings rate as a percentage (0-100). Returns 0 when there is no income. */
export function getSavingsRate(transactions: Transaction[]): number {
  const income = getIncome(transactions)
  if (income <= 0) return 0
  return ((income - getExpenses(transactions)) / income) * 100
}

export function filterByMonth(transactions: Transaction[], monthKey: string): Transaction[] {
  return transactions.filter((t) => monthKeyOf(t.date) === monthKey)
}

export interface MonthTotals {
  key: string
  income: number
  expenses: number
  balance: number
}

export function getMonthTotals(transactions: Transaction[], monthKey: string): MonthTotals {
  const monthTx = filterByMonth(transactions, monthKey)
  const income = sumIncome(monthTx)
  const expenses = sumExpenses(monthTx)
  return { key: monthKey, income, expenses, balance: income - expenses }
}

export interface CategoryTotal {
  name: string
  amount: number
}

/** Sum of amounts grouped by category, sorted descending. */
export function getCategoryTotals(
  transactions: Transaction[],
  type: Transaction['type'] = 'expense',
): CategoryTotal[] {
  const totals = new Map<string, number>()
  for (const t of transactions) {
    if (t.type !== type) continue
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount)
  }
  return [...totals.entries()]
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
}

export function getTopCategories(
  transactions: Transaction[],
  limit = 5,
  type: Transaction['type'] = 'expense',
): CategoryTotal[] {
  return getCategoryTotals(transactions, type).slice(0, limit)
}

export interface SeriesPoint {
  key: string
  label: string
  income: number
  expenses: number
}

/** Income/expense series for a list of month keys (used by charts). */
export function getMonthlySeries(
  transactions: Transaction[],
  monthKeys: string[],
  labelFn: (key: string) => string,
): SeriesPoint[] {
  return monthKeys.map((key) => {
    const totals = getMonthTotals(transactions, key)
    return {
      key,
      label: labelFn(key),
      income: totals.income,
      expenses: totals.expenses,
    }
  })
}

/** Percentage change of `current` vs `previous` (positive = growth). */
export function getPercentChange(current: number, previous: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100
  }
  return ((current - previous) / previous) * 100
}
