import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { Button } from '../components/ui/Button'
import { MonthSelector } from '../components/dashboard/MonthSelector'
import { SummaryCards } from '../components/dashboard/SummaryCards'
import { SpendingChart } from '../components/dashboard/SpendingChart'
import { ExpenseBreakdown } from '../components/dashboard/ExpenseBreakdown'
import { RecentTransactions } from '../components/dashboard/RecentTransactions'
import { BudgetOverview } from '../components/dashboard/BudgetOverview'
import { SavingsGoalWidget } from '../components/dashboard/SavingsGoalWidget'
import { TransactionFormModal } from '../components/transactions/TransactionFormModal'
import { currentMonthKey } from '../utils/dates'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function Dashboard() {
  const { settings } = useFinance()
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey())
  const [formOpen, setFormOpen] = useState(false)

  const heading = useMemo(() => `${greeting()}, ${settings.name || 'there'}`, [settings.name])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{heading}</h1>
          <p className="mt-1 text-sm text-ink-muted">Here&apos;s your financial overview.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
          <Button onClick={() => setFormOpen(true)} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
            Add Transaction
          </Button>
        </div>
      </div>

      <SummaryCards monthKey={selectedMonth} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SpendingChart monthKey={selectedMonth} />
        </div>
        <ExpenseBreakdown monthKey={selectedMonth} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <BudgetOverview monthKey={selectedMonth} />
        <SavingsGoalWidget />
        <div className="md:col-span-2 xl:col-span-1">
          <RecentTransactions />
        </div>
      </div>

      <TransactionFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  )
}
