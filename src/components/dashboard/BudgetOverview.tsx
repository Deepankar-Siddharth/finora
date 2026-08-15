import { Link } from 'react-router-dom'
import { ArrowRight, PiggyBank } from 'lucide-react'
import { useFinance } from '../../context/FinanceContext'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { ProgressBar } from '../ui/ProgressBar'
import { CategoryIcon } from '../ui/CategoryIcon'
import { formatCurrency } from '../../utils/currency'
import { getBudgetUsage } from '../../utils/budgets'

export function BudgetOverview({ monthKey }: { monthKey: string }) {
  const { budgets, transactions, settings } = useFinance()

  const activeBudgets = budgets
    .filter((b) => b.month === monthKey)
    .map((b) => ({ budget: b, usage: getBudgetUsage(b, transactions) }))
    .sort((a, b) => b.usage.percent - a.usage.percent)
    .slice(0, 4)

  return (
    <Card className="flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">Budget Overview</h2>
        <Link
          to="/budgets"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand transition-colors hover:text-brand/80"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      {activeBudgets.length === 0 ? (
        <EmptyState
          icon={<PiggyBank className="h-5 w-5" aria-hidden="true" />}
          title="No budgets set"
          description="Create a budget to keep your spending on track."
        />
      ) : (
        <ul className="space-y-4">
          {activeBudgets.map(({ budget, usage }) => (
            <li key={budget.id}>
              <div className="mb-1.5 flex items-center gap-2.5">
                <CategoryIcon category={budget.category} size="sm" />
                <span className="flex-1 truncate text-sm font-medium text-ink">
                  {budget.category}
                </span>
                <span className="text-xs tabular-nums text-ink-muted">
                  {formatCurrency(usage.spent, settings.currency)} /{' '}
                  {formatCurrency(budget.limit, settings.currency)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ProgressBar
                  value={usage.percent}
                  status={usage.status}
                  className="flex-1"
                  label={`${budget.category} budget usage`}
                />
                <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums text-ink-soft">
                  {usage.percent.toFixed(0)}%
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
