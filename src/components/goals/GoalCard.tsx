import { Pencil, Trash2 } from 'lucide-react'
import type { SavingsGoal } from '../../types'
import { useFinance } from '../../context/FinanceContext'
import { Card } from '../ui/Card'
import { ProgressBar } from '../ui/ProgressBar'
import { formatCurrency } from '../../utils/currency'
import { formatDate } from '../../utils/dates'

interface GoalCardProps {
  goal: SavingsGoal
  onEdit: (goal: SavingsGoal) => void
  onDelete: (goal: SavingsGoal) => void
}

export function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const { settings } = useFinance()
  const percent = goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0
  const remaining = Math.max(0, goal.target - goal.current)
  const reached = percent >= 100

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink">{goal.name}</p>
          <p className="text-xs text-ink-muted">
            {formatCurrency(goal.current, settings.currency)} of{' '}
            {formatCurrency(goal.target, settings.currency)}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onEdit(goal)}
            aria-label={`Edit ${goal.name}`}
            className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(goal)}
            aria-label={`Delete ${goal.name}`}
            className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ProgressBar
          value={percent}
          status="ok"
          className="flex-1"
          label={`${goal.name} progress`}
        />
        <span className="w-11 shrink-0 text-right text-sm font-semibold tabular-nums text-ink">
          {percent.toFixed(0)}%
        </span>
      </div>

      <p className="text-xs text-ink-muted">
        {reached
          ? 'Goal reached — well done!'
          : `${formatCurrency(remaining, settings.currency)} remaining`}
        {goal.targetDate && ` · target ${formatDate(goal.targetDate)}`}
      </p>
    </Card>
  )
}
