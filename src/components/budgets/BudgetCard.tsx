import { AlertTriangle, Pencil, Trash2 } from 'lucide-react'
import type { Budget } from '../../types'
import { useFinance } from '../../context/FinanceContext'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { ProgressBar } from '../ui/ProgressBar'
import { CategoryIcon } from '../ui/CategoryIcon'
import { formatCurrency } from '../../utils/currency'
import { getBudgetUsage, isBudgetWarned, getBudgetWarningMessage } from '../../utils/budgets'

interface BudgetCardProps {
  budget: Budget
  onEdit: (budget: Budget) => void
  onDelete: (budget: Budget) => void
}

const STATUS_LABEL = { ok: 'On track', almost: 'Almost reached', exceeded: 'Exceeded' } as const
const STATUS_TONE = { ok: 'success', almost: 'warning', exceeded: 'danger' } as const

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const { transactions, settings } = useFinance()
  const usage = getBudgetUsage(budget, transactions)
  const warned = isBudgetWarned(usage)

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <CategoryIcon category={budget.category} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{budget.category}</p>
          <p className="text-xs text-ink-muted">
            {formatCurrency(usage.spent, settings.currency)} of{' '}
            {formatCurrency(budget.limit, settings.currency)}
          </p>
        </div>
        <Badge tone={STATUS_TONE[usage.status]}>{STATUS_LABEL[usage.status]}</Badge>
      </div>

      <div className="flex items-center gap-2">
        <ProgressBar
          value={usage.percent}
          status={usage.status}
          className="flex-1"
          label={`${budget.category} budget usage`}
        />
        <span className="w-11 shrink-0 text-right text-sm font-semibold tabular-nums text-ink">
          {usage.percent.toFixed(0)}%
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-ink-muted">
        <span>
          {usage.status === 'exceeded'
            ? `${formatCurrency(usage.spent - budget.limit, settings.currency)} over budget`
            : `${formatCurrency(usage.remaining, settings.currency)} remaining`}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onEdit(budget)}
            aria-label={`Edit ${budget.category} budget`}
            className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(budget)}
            aria-label={`Delete ${budget.category} budget`}
            className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {warned && (
        <div
          role="status"
          className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${
            usage.status === 'exceeded'
              ? 'bg-danger-soft text-danger'
              : 'bg-warning-soft text-warning'
          }`}
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            {budget.category} budget is {usage.status === 'exceeded' ? 'exceeded' : 'almost reached'}.{' '}
            {getBudgetWarningMessage(budget, usage)}
          </span>
        </div>
      )}
    </Card>
  )
}
