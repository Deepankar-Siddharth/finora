import { useMemo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { ChartPie } from 'lucide-react'
import { useFinance } from '../../context/FinanceContext'
import { getCategoryMeta } from '../../constants/categories'
import { Card } from '../ui/Card'
import { formatCurrency } from '../../utils/currency'
import { currentMonthKey } from '../../utils/dates'
import { filterByMonth, getCategoryTotals } from '../../utils/transactions'

/** Current-month category spend as a donut plus a ranked list. */
export function CategorySpending() {
  const { transactions, settings } = useFinance()

  const items = useMemo(() => {
    const monthTx = filterByMonth(transactions, currentMonthKey())
    const totals = getCategoryTotals(monthTx, 'expense')
    const total = totals.reduce((s, c) => s + c.amount, 0)
    return totals.map((c) => ({
      name: c.name,
      value: c.amount,
      percent: total > 0 ? (c.amount / total) * 100 : 0,
      color: getCategoryMeta(c.name).color,
    }))
  }, [transactions])

  return (
    <Card className="flex flex-col">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-ink-muted">
          <ChartPie className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-ink">Category Spending</h2>
          <p className="text-sm text-ink-muted">This month, ranked by amount</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="flex flex-1 items-center justify-center py-10 text-sm text-ink-muted">
          No expenses recorded this month.
        </p>
      ) : (
        <div className="flex flex-1 flex-col items-center gap-6 sm:flex-row">
          <div className="h-40 w-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={items}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  strokeWidth={2}
                  stroke="var(--surface)"
                >
                  {items.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full flex-1 space-y-3">
            {items.slice(0, 6).map((item) => (
              <div key={item.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex min-w-0 items-center gap-2 text-ink-soft">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                      aria-hidden="true"
                    />
                    <span className="truncate">{item.name}</span>
                  </span>
                  <span className="ml-3 shrink-0 tabular-nums text-ink">
                    {formatCurrency(item.value, settings.currency)}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
