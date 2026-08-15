import { ArrowDownToLine, ArrowUpFromLine, PiggyBank, Wallet } from 'lucide-react'
import { useFinance } from '../../context/FinanceContext'
import { StatCard } from '../ui/StatCard'
import { formatCurrency } from '../../utils/currency'
import {
  filterByMonth,
  getPercentChange,
  getSavingsRate,
  getIncome,
  getExpenses,
} from '../../utils/transactions'
import { shiftMonth } from '../../utils/dates'

interface SummaryCardsProps {
  monthKey: string
}

/** The four headline cards; every value is derived from transaction data. */
export function SummaryCards({ monthKey }: SummaryCardsProps) {
  const { transactions, settings } = useFinance()
  const currency = settings.currency

  const monthTx = filterByMonth(transactions, monthKey)
  const prevMonthTx = filterByMonth(transactions, shiftMonth(monthKey, -1))

  const income = getIncome(monthTx)
  const expenses = getExpenses(monthTx)
  const balance = income - expenses
  const savingsRate = getSavingsRate(monthTx)

  const prevIncome = getIncome(prevMonthTx)
  const prevExpenses = getExpenses(prevMonthTx)
  const prevBalance = prevIncome - prevExpenses

  const hasPrevData = prevMonthTx.length > 0
  const hasData = monthTx.length > 0

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Balance"
        value={formatCurrency(balance, currency)}
        icon={<Wallet className="h-4.5 w-4.5" aria-hidden="true" />}
        tone={balance >= 0 ? 'brand' : 'danger'}
        delta={hasData && hasPrevData ? getPercentChange(balance, prevBalance) : null}
        deltaLabel="vs last month"
      />
      <StatCard
        label="Income"
        value={formatCurrency(income, currency)}
        icon={<ArrowDownToLine className="h-4.5 w-4.5" aria-hidden="true" />}
        tone="success"
        delta={hasData && hasPrevData ? getPercentChange(income, prevIncome) : null}
        deltaLabel="vs last month"
      />
      <StatCard
        label="Expenses"
        value={formatCurrency(expenses, currency)}
        icon={<ArrowUpFromLine className="h-4.5 w-4.5" aria-hidden="true" />}
        tone="danger"
        delta={hasData && hasPrevData ? getPercentChange(expenses, prevExpenses) : null}
        deltaLabel="vs last month"
        deltaPositiveIsGood={false}
      />
      <StatCard
        label="Savings"
        value={formatCurrency(balance, currency)}
        icon={<PiggyBank className="h-4.5 w-4.5" aria-hidden="true" />}
        tone="info"
        footer={
          hasData && income > 0 ? (
            <p className="mt-1.5 text-xs text-ink-muted">
              <span className="font-medium text-info">{savingsRate.toFixed(1)}%</span> savings rate
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-ink-muted">No income recorded this month</p>
          )
        }
      />
    </div>
  )
}
