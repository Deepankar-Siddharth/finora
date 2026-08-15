import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ReactNode } from 'react'
import { useFinance } from '../../context/FinanceContext'
import { Card } from '../ui/Card'
import { formatCurrency } from '../../utils/currency'
import { currentMonthKey, shiftMonth } from '../../utils/dates'
import { getMonthTotals, type MonthTotals } from '../../utils/transactions'

type Key = 'income' | 'expenses' | 'balance'

interface TrendChartProps {
  title: string
  subtitle: string
  dataKey: Key
  color: string
  icon: ReactNode
  /** Color used for negative bars (e.g. savings below zero). */
  negativeColor?: string
}

function TrendTooltip({
  active,
  payload,
  currency,
  labelKey,
}: {
  active?: boolean
  payload?: { payload: MonthTotals }[]
  currency: string
  labelKey: Key
}) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 shadow-pop">
      <p className="mb-1 text-xs font-medium text-ink-muted">{point.key}</p>
      <p className="text-sm font-semibold tabular-nums text-ink">
        {formatCurrency(point[labelKey], currency)}
      </p>
    </div>
  )
}

/** Bar chart of a monthly financial metric across the last 12 months. */
export function TrendChart({
  title,
  subtitle,
  dataKey,
  color,
  negativeColor,
  icon,
}: TrendChartProps) {
  const { transactions, settings } = useFinance()

  const data = useMemo<MonthTotals[]>(() => {
    const keys: string[] = []
    for (let offset = 11; offset >= 0; offset--) {
      keys.push(shiftMonth(currentMonthKey(), -offset))
    }
    return keys.map((key) => getMonthTotals(transactions, key))
  }, [transactions])

  return (
    <Card className="flex flex-col">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-ink-muted">
          {icon}
        </span>
        <div>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <p className="text-sm text-ink-muted">{subtitle}</p>
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="key"
              tickLine={false}
              axisLine={false}
              minTickGap={16}
              tickFormatter={(value: string) =>
                new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(new Date(`${value}-01`))
              }
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={52}
              tickFormatter={(value: number) =>
                formatCurrency(value, settings.currency, { compact: true })
              }
            />
            <Tooltip
              content={<TrendTooltip currency={settings.currency} labelKey={dataKey} />}
              cursor={{ fill: 'var(--surface-2)', radius: 6 }}
            />
            <Bar dataKey={dataKey} radius={[6, 6, 0, 0]} maxBarSize={28}>
              {data.map((point) => {
                const value = point[dataKey]
                const useNegative = negativeColor !== undefined && value < 0
                return <Cell key={point.key} fill={useNegative ? negativeColor : color} />
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
