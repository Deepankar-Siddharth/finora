import { useMemo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { ChartPie } from 'lucide-react'
import { useFinance } from '../../context/FinanceContext'
import { getCategoryMeta } from '../../constants/categories'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { formatCurrency } from '../../utils/currency'
import { filterByMonth, getCategoryTotals } from '../../utils/transactions'

function CenterLabel({ total }: { total: number }) {
  const { settings } = useFinance()
  return (
    <g>
      <text x="50%" y="47%" textAnchor="middle" className="fill-ink-muted" style={{ fontSize: 11 }}>
        Total spent
      </text>
      <text
        x="50%"
        y="58%"
        textAnchor="middle"
        className="fill-ink"
        style={{ fontSize: 16, fontWeight: 600 }}
      >
        {formatCurrency(total, settings.currency, { compact: true })}
      </text>
    </g>
  )
}

interface BreakdownItem {
  name: string
  value: number
  percent: number
  color: string
}

function BreakdownTooltip({ active, payload }: { active?: boolean; payload?: { payload: BreakdownItem }[] }) {
  const { settings } = useFinance()
  if (!active || !payload || payload.length === 0) return null
  const item = payload[0].payload
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 shadow-pop">
      <p className="text-xs font-medium text-ink-muted">{item.name}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-ink">
        {formatCurrency(item.value, settings.currency)}
      </p>
      <p className="text-xs tabular-nums text-ink-muted">{item.percent.toFixed(1)}% of spending</p>
    </div>
  )
}

export function ExpenseBreakdown({ monthKey }: { monthKey: string }) {
  const { transactions, settings } = useFinance()

  const categories = useMemo(() => {
    const monthTx = filterByMonth(transactions, monthKey)
    const totals = getCategoryTotals(monthTx, 'expense')
    const total = totals.reduce((s, c) => s + c.amount, 0)
    return {
      total,
      items: totals.map((c) => ({
        name: c.name,
        value: c.amount,
        percent: total > 0 ? (c.amount / total) * 100 : 0,
        color: getCategoryMeta(c.name).color,
      })),
    }
  }, [transactions, monthKey])

  if (categories.items.length === 0) {
    return (
      <Card>
        <h2 className="mb-1 text-base font-semibold text-ink">Expense Breakdown</h2>
        <p className="mb-4 text-sm text-ink-muted">Spending by category</p>
        <EmptyState
          icon={<ChartPie className="h-5 w-5" aria-hidden="true" />}
          title="No expenses this month"
          description="Add a transaction to see how your spending is distributed."
        />
      </Card>
    )
  }

  return (
    <Card className="flex flex-col">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-ink">Expense Breakdown</h2>
        <p className="text-sm text-ink-muted">Spending by category</p>
      </div>

      <div className="flex flex-1 flex-col items-center gap-6 sm:flex-row sm:items-center">
        <div className="relative h-48 w-48 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<BreakdownTooltip />} cursor={{ fill: 'transparent' }} />
              <Pie
                data={categories.items}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                strokeWidth={2}
                stroke="var(--surface)"
              >
                {categories.items.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Pie>
              <CenterLabel total={categories.total} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul className="scrollbar-thin w-full flex-1 space-y-2.5">
          {categories.items.map((item) => (
            <li key={item.name} className="flex items-center gap-3">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate text-sm text-ink-soft">{item.name}</span>
              <span className="text-xs tabular-nums text-ink-muted">{item.percent.toFixed(1)}%</span>
              <span className="w-20 shrink-0 text-right text-sm font-medium tabular-nums text-ink">
                {formatCurrency(item.value, settings.currency)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}
