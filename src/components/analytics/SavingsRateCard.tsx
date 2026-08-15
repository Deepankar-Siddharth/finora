import { Percent, Wallet } from 'lucide-react'
import { useFinance } from '../../context/FinanceContext'
import { Card } from '../ui/Card'
import { ProgressBar } from '../ui/ProgressBar'
import { formatCurrency } from '../../utils/currency'
import { currentMonthKey } from '../../utils/dates'
import { filterByMonth, getIncome, getExpenses, getSavingsRate } from '../../utils/transactions'

/** Current-month savings rate plus progress toward the income target. */
export function SavingsRateCard() {
  const { transactions, settings } = useFinance()
  const monthTx = filterByMonth(transactions, currentMonthKey())
  const income = getIncome(monthTx)
  const expenses = getExpenses(monthTx)
  const rate = getSavingsRate(monthTx)
  const savings = income - expenses

  const target = settings.monthlyIncomeTarget
  const targetProgress = target > 0 ? Math.min(100, (income / target) * 100) : 0

  return (
    <Card className="flex flex-col">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-info-soft text-info">
          <Percent className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-ink">Savings Rate</h2>
          <p className="text-sm text-ink-muted">This month</p>
        </div>
      </div>

      <p className="text-4xl font-semibold tracking-tight text-ink">
        {income > 0 ? `${rate.toFixed(1)}%` : '—'}
      </p>
      <p className="mt-1 text-sm text-ink-muted">
        You saved {formatCurrency(savings, settings.currency)} this month.
      </p>

      <div className="mt-5 border-t border-border pt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1 text-ink-soft">
            <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
            Monthly income target
          </span>
          <span className="font-medium tabular-nums text-ink">
            {formatCurrency(income, settings.currency)} / {formatCurrency(target, settings.currency)}
          </span>
        </div>
        <ProgressBar value={targetProgress} status="ok" label="Monthly income target progress" />
      </div>
    </Card>
  )
}
