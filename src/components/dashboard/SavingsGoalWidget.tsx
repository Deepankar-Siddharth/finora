import { Link } from 'react-router-dom'
import { Target } from 'lucide-react'
import { useFinance } from '../../context/FinanceContext'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { ProgressBar } from '../ui/ProgressBar'
import { formatCurrency } from '../../utils/currency'
import { formatDate } from '../../utils/dates'

/** Most relevant savings goal: the one closest to completion. */
export function SavingsGoalWidget() {
  const { goals, settings } = useFinance()

  const goal = goals.length > 0 ? [...goals].sort((a, b) => b.current / b.target - a.current / a.target)[0] : null

  if (!goal) {
    return (
      <Card className="flex flex-col">
        <h2 className="mb-1 text-base font-semibold text-ink">Savings Goal</h2>
        <p className="mb-4 text-sm text-ink-muted">Track progress toward your goals</p>
        <EmptyState
          icon={<Target className="h-5 w-5" aria-hidden="true" />}
          title="No goals yet"
          description="Set a savings goal to watch your progress grow."
        />
      </Card>
    )
  }

  const percent = goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0
  const remaining = Math.max(0, goal.target - goal.current)

  return (
    <Card className="flex flex-col">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-ink">Savings Goal</h2>
        <Link
          to="/budgets"
          className="text-sm font-medium text-brand transition-colors hover:text-brand/80"
        >
          Manage
        </Link>
      </div>
      <p className="mb-4 text-sm text-ink-muted">Track progress toward your goals</p>

      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
          <Target className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{goal.name}</p>
          <p className="text-xs text-ink-muted">
            {formatCurrency(goal.current, settings.currency)} of{' '}
            {formatCurrency(goal.target, settings.currency)}
          </p>
        </div>
        <span className="shrink-0 text-lg font-semibold tabular-nums text-brand">
          {percent.toFixed(0)}%
        </span>
      </div>

      <ProgressBar
        value={percent}
        status="ok"
        className="mt-3"
        label={`${goal.name} progress`}
      />

      <p className="mt-3 text-xs text-ink-muted">
        {remaining > 0
          ? `${formatCurrency(remaining, settings.currency)} remaining`
          : 'Goal reached — well done!'}
        {goal.targetDate && ` · target ${formatDate(goal.targetDate)}`}
      </p>
    </Card>
  )
}
