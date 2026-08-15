import { Link } from 'react-router-dom'
import { ArrowRight, ReceiptText } from 'lucide-react'
import { useFinance } from '../../context/FinanceContext'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { CategoryIcon } from '../ui/CategoryIcon'
import { formatCurrency } from '../../utils/currency'
import { formatShortDate } from '../../utils/dates'

/** Latest transactions across all months, shown on the dashboard. */
export function RecentTransactions() {
  const { transactions, settings } = useFinance()

  const recent = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)

  return (
    <Card className="flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">Recent Transactions</h2>
        <Link
          to="/transactions"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand transition-colors hover:text-brand/80"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      {recent.length === 0 ? (
        <EmptyState
          icon={<ReceiptText className="h-5 w-5" aria-hidden="true" />}
          title="No transactions yet"
          description="Add your first transaction to see it here."
        />
      ) : (
        <ul className="divide-y divide-border">
          {recent.map((tx) => (
            <li key={tx.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <CategoryIcon category={tx.category} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">
                  {tx.description}
                </span>
                <span className="block text-xs text-ink-muted">
                  {formatShortDate(tx.date)} · {tx.category}
                </span>
              </span>
              <span
                className={`shrink-0 text-sm font-semibold tabular-nums ${
                  tx.type === 'income' ? 'text-success' : 'text-danger'
                }`}
              >
                {tx.type === 'income' ? '+' : '-'}
                {formatCurrency(tx.amount, settings.currency)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
