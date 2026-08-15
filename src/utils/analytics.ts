import type { Budget, Transaction } from '../types'
import { currentMonthKey, monthKeyOf } from './dates'
import { getBudgetUsage } from './budgets'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Estimate a 0-100 financial health score from three factors:
 * - Savings rate (weight 40%)
 * - Expense/income ratio (weight 30%)
 * - Budget adherence (weight 30%)
 *
 * This is an estimate for informational purposes only, never financial advice.
 */
export function getFinancialHealthScore(
  transactions: Transaction[],
  budgets: Budget[],
): { score: number; savings: number; ratio: number; budget: number } {
  const monthKey = currentMonthKey()
  const monthTx = transactions.filter((t) => monthKeyOf(t.date) === monthKey)

  const income = monthTx.reduce((s, t) => (t.type === 'income' ? s + t.amount : s), 0)
  const expenses = monthTx.reduce((s, t) => (t.type === 'expense' ? s + t.amount : s), 0)

  // Factor 1: savings rate. 20%+ scores 100, linear below that.
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0
  const savingsScore = clamp((savingsRate / 20) * 100, 0, 100)

  // Factor 2: expense/income ratio. 50% or lower scores 100, worse as it climbs.
  const ratio = income > 0 ? expenses / income : 0
  const ratioScore = clamp(100 - Math.max(0, ratio - 0.5) * 200, 0, 100)

  // Factor 3: budget adherence. Penalize overruns proportionally.
  let budgetScore: number
  const activeBudgets = budgets.filter((b) => b.month === monthKey)
  if (activeBudgets.length === 0) {
    budgetScore = 80 // Neutral when no budgets are configured.
  } else {
    const scores = activeBudgets.map((b) => {
      const { spent } = getBudgetUsage(b, transactions)
      const { limit } = b
      if (limit <= 0) return 1
      return spent <= limit ? 1 : clamp(1 - (spent - limit) / limit, 0, 1)
    })
    budgetScore = (scores.reduce((s, v) => s + v, 0) / scores.length) * 100
  }

  const score = Math.round(savingsScore * 0.4 + ratioScore * 0.3 + budgetScore * 0.3)
  return { score, savings: savingsScore, ratio: ratioScore, budget: budgetScore }
}

export interface HealthFactor {
  label: string
  score: number
}

export function getHealthBreakdown(factors: {
  savings: number
  ratio: number
  budget: number
}): HealthFactor[] {
  return [
    { label: 'Savings rate', score: Math.round(factors.savings) },
    { label: 'Expense / income ratio', score: Math.round(factors.ratio) },
    { label: 'Budget adherence', score: Math.round(factors.budget) },
  ]
}

export function getHealthLabel(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Needs attention'
}
