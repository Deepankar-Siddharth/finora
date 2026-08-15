import { Trophy } from 'lucide-react'
import { useFinance } from '../../context/FinanceContext'
import { getCategoryMeta } from '../../constants/categories'
import { Card } from '../ui/Card'
import { CategoryIcon } from '../ui/CategoryIcon'
import { formatCurrency } from '../../utils/currency'
import { currentMonthKey } from '../../utils/dates'
import { filterByMonth, getCategoryTotals } from '../../utils/transactions'

/** Ranked list of the categories where the user spends the most this month. */
export function TopCategories() {
  const { transactions, settings } = useFinance()

  const items = (() => {
    const monthTx = filterByMonth(transactions, currentMonthKey())
    const totals = getCategoryTotals(monthTx, 'expense')
    const total = totals.reduce((s, c) => s + c.amount, 0)
    return totals.slice(0, 5).map((c) => ({
      ...c,
      percent: total > 0 ? (c.amount / total) * 100 : 0,
      color: getCategoryMeta(c.name).color,
    }))
  })()

  return (
    <Card className="flex flex-col">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning-soft text-warning">
          <Trophy className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-ink">Top Spending Categories</h2>
          <p className="text-sm text-ink-muted">Where you spent the most this month</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="flex flex-1 items-center justify-center py-10 text-sm text-ink-muted">
          No expenses recorded this month.
        </p>
      ) : (
        <ol className="space-y-3">
          {items.map((item, index) => (
            <li key={item.name} className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  index === 0
                    ? 'bg-warning-soft text-warning'
                    : index === 1
                      ? 'bg-surface-2 text-ink-soft'
                      : 'bg-surface-3 text-ink-muted'
                }`}
              >
                {index + 1}
              </span>
              <CategoryIcon category={item.name} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-medium text-ink">{item.name}</span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                    {formatCurrency(item.amount, settings.currency)}
                  </span>
                </span>
                <span className="mt-1 block text-xs tabular-nums text-ink-muted">
                  {item.percent.toFixed(1)}% of monthly spending
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}
