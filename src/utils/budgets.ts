import type { Budget, BudgetStatus, Transaction } from '../types'
import { filterByMonth } from './transactions'

export interface BudgetUsage {
  spent: number
  remaining: number
  percent: number
  status: BudgetStatus
}

/** Compute actual spending against a budget for its configured month. */
export function getBudgetUsage(budget: Budget, transactions: Transaction[]): BudgetUsage {
  const spent = filterByMonth(transactions, budget.month).reduce(
    (sum, t) => (t.type === 'expense' && t.category === budget.category ? sum + t.amount : sum),
    0,
  )
  const percent = budget.limit > 0 ? Math.min(100, (spent / budget.limit) * 100) : 0
  const status = getBudgetStatus(spent, budget.limit)
  return { spent, remaining: Math.max(0, budget.limit - spent), percent, status }
}

export function getBudgetStatus(spent: number, limit: number): BudgetStatus {
  if (limit > 0 && spent > limit) return 'exceeded'
  if (limit > 0 && spent / limit >= 0.9) return 'almost'
  return 'ok'
}

/** True when a budget is close to or over its limit (>= 75% usage). */
export function isBudgetWarned(usage: BudgetUsage): boolean {
  return usage.percent >= 75 || usage.status === 'exceeded'
}

export function getBudgetWarningMessage(budget: Budget, usage: BudgetUsage): string {
  if (usage.status === 'exceeded') {
    const over = usage.spent - budget.limit
    return `Budget exceeded by ${new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(over)}.`
  }
  if (usage.percent >= 90) {
    return `${usage.percent.toFixed(0)}% of this budget is used.`
  }
  return `${usage.percent.toFixed(0)}% of this budget is used — almost there.`
}
