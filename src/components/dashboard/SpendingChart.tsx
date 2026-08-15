import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Transaction } from '../../types'
import { useFinance } from '../../context/FinanceContext'
import { Card } from '../ui/Card'
import { formatCurrency } from '../../utils/currency'
import {
  addDays,
  currentMonthKey,
  monthKeyOf,
  parseISODate,
  shiftMonth,
  todayISO,
  toISODate,
} from '../../utils/dates'
import { getIncome, getExpenses, type SeriesPoint } from '../../utils/transactions'

type Range = 'week' | 'month' | 'year'

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
]

interface TooltipPoint {
  label: string
  income: number
  expenses: number
}

function buildDailySeries(
  transactions: Transaction[],
  startISO: string,
  endISO: string,
  labelFn: (iso: string) => string,
): SeriesPoint[] {
  const byDate = new Map<string, { income: number; expenses: number }>()
  for (const t of transactions) {
    const bucket = byDate.get(t.date) ?? { income: 0, expenses: 0 }
    if (t.type === 'income') bucket.income += t.amount
    else bucket.expenses += t.amount
    byDate.set(t.date, bucket)
  }

  const points: SeriesPoint[] = []
  const cursor = new Date(parseISODate(startISO))
  const end = parseISODate(endISO)
  while (cursor <= end) {
    const iso = toISODate(cursor)
    const bucket = byDate.get(iso) ?? { income: 0, expenses: 0 }
    points.push({
      key: iso,
      label: labelFn(iso),
      income: bucket.income,
      expenses: bucket.expenses,
    })
    cursor.setDate(cursor.getDate() + 1)
  }
  return points
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: TooltipPoint }[] }) {
  const { settings } = useFinance()
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 shadow-pop">
      <p className="mb-1.5 text-xs font-medium text-ink-muted">{point.label}</p>
      <p className="flex items-center gap-2 text-sm text-ink">
        <span className="h-2 w-2 rounded-full bg-[#10b981]" aria-hidden="true" />
        Income
        <span className="ml-auto font-semibold text-success">
          {formatCurrency(point.income, settings.currency)}
        </span>
      </p>
      <p className="mt-1 flex items-center gap-2 text-sm text-ink">
        <span className="h-2 w-2 rounded-full bg-[#ef4444]" aria-hidden="true" />
        Expenses
        <span className="ml-auto font-semibold text-danger">
          {formatCurrency(point.expenses, settings.currency)}
        </span>
      </p>
    </div>
  )
}

export function SpendingChart({ monthKey }: { monthKey: string }) {
  const { transactions, settings } = useFinance()
  const [range, setRange] = useState<Range>('month')

  const data = useMemo<SeriesPoint[]>(() => {
    const today = todayISO()
    if (range === 'year') {
      const keys: string[] = []
      for (let offset = 11; offset >= 0; offset--) keys.push(shiftMonth(currentMonthKey(), -offset))
      return keys.map((key) => {
        const inMonth = transactions.filter((t) => monthKeyOf(t.date) === key)
        return {
          key,
          label: new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(
            parseISODate(`${key}-01`),
          ),
          income: getIncome(inMonth),
          expenses: getExpenses(inMonth),
        }
      })
    }

    const start = range === 'week' ? addDays(today, -6) : `${monthKey}-01`
    const lastDay =
      range === 'week'
        ? today
        : toISODate(
            new Date(
              parseISODate(`${monthKey}-01`).getFullYear(),
              parseISODate(`${monthKey}-01`).getMonth() + 1,
              0,
            ),
          )

    const labelFn =
      range === 'week'
        ? (iso: string) =>
            new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(parseISODate(iso))
        : (iso: string) => new Intl.DateTimeFormat('en-IN', { day: 'numeric' }).format(parseISODate(iso))

    return buildDailySeries(transactions, start, lastDay, labelFn)
  }, [transactions, range, monthKey])

  return (
    <Card className="flex flex-col">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">Spending Overview</h2>
          <p className="text-sm text-ink-muted">Income and expenses over time</p>
        </div>
        <div
          role="group"
          aria-label="Chart time range"
          className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5"
        >
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={range === option.value}
              onClick={() => setRange(option.value)}
              className={[
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                range === option.value
                  ? 'bg-surface text-ink shadow-sm'
                  : 'text-ink-muted hover:text-ink',
              ].join(' ')}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              minTickGap={range === 'month' ? 28 : 20}
              padding={{ left: 8, right: 8 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={54}
              tickFormatter={(value: number) => formatCurrency(value, settings.currency, { compact: true })}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-strong)' }} />
            <Area
              type="monotone"
              dataKey="income"
              name="Income"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#incomeFill)"
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#expenseFill)"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
