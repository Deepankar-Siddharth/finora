import { CalendarClock, Play, Pencil, Trash2 } from 'lucide-react'
import type { RecurringTransaction } from '../../types'
import { FREQUENCY_LABELS, getCategoryMeta } from '../../constants/categories'
import { useFinance } from '../../context/FinanceContext'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { CategoryIcon } from '../ui/CategoryIcon'
import { formatCurrency } from '../../utils/currency'
import { formatDate } from '../../utils/dates'

interface RecurringCardProps {
  item: RecurringTransaction
  onEdit: (item: RecurringTransaction) => void
  onDelete: (item: RecurringTransaction) => void
  onGenerate: (item: RecurringTransaction) => void
}

export function RecurringCard({ item, onEdit, onDelete, onGenerate }: RecurringCardProps) {
  const { settings } = useFinance()
  const meta = getCategoryMeta(item.category)
  const Icon = meta.icon

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <CategoryIcon category={item.category} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
          <p className="flex items-center gap-1 text-xs text-ink-muted">
            <Icon className="h-3 w-3" aria-hidden="true" />
            {item.category}
          </p>
        </div>
        <Badge tone={item.type === 'income' ? 'success' : 'danger'}>
          {item.type === 'income' ? 'Income' : 'Expense'}
        </Badge>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p
            className={`text-lg font-semibold tabular-nums ${
              item.type === 'income' ? 'text-success' : 'text-danger'
            }`}
          >
            {item.type === 'income' ? '+' : '-'}
            {formatCurrency(item.amount, settings.currency)}
          </p>
          <p className="text-xs text-ink-muted">{FREQUENCY_LABELS[item.frequency]}</p>
        </div>
        <p className="inline-flex items-center gap-1 text-xs text-ink-muted">
          <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
          Next: {formatDate(item.nextDate)}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <button
          type="button"
          onClick={() => onGenerate(item)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-soft px-3 py-1.5 text-xs font-medium text-brand transition-colors hover:bg-brand hover:text-white"
        >
          <Play className="h-3.5 w-3.5" aria-hidden="true" />
          Generate next occurrence
        </button>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onEdit(item)}
            aria-label={`Edit ${item.name}`}
            className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            aria-label={`Delete ${item.name}`}
            className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </Card>
  )
}
