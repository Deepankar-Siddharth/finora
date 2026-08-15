import type { Transaction } from '../../types'
import { getCategoryMeta } from '../../constants/categories'
import { Badge } from '../ui/Badge'
import { CategoryIcon } from '../ui/CategoryIcon'
import { formatCurrency } from '../../utils/currency'
import { formatDate } from '../../utils/dates'
import { Pencil, Trash2 } from 'lucide-react'

interface TransactionTableProps {
  transactions: Transaction[]
  currency: string
  highlightId?: string
  onEdit: (tx: Transaction) => void
  onDelete: (tx: Transaction) => void
}

export function TransactionTable({
  transactions,
  currency,
  highlightId,
  onEdit,
  onDelete,
}: TransactionTableProps) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-2xl border border-border bg-surface shadow-card md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <caption className="sr-only">Transactions</caption>
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-ink-muted">
              <th scope="col" className="px-4 py-3 font-medium">
                Date
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Description
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Category
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Payment Method
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Type
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Amount
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                className={`transition-colors hover:bg-surface-2/60 ${
                  tx.id === highlightId ? 'bg-brand-soft/60' : ''
                }`}
              >
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDate(tx.date)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <CategoryIcon category={tx.category} size="sm" />
                    <div>
                      <p className="font-medium text-ink">{tx.description}</p>
                      {tx.notes && <p className="text-xs text-ink-muted">{tx.notes}</p>}
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{tx.category}</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{tx.paymentMethod}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <Badge tone={tx.type === 'income' ? 'success' : 'danger'}>
                    {tx.type === 'income' ? 'Income' : 'Expense'}
                  </Badge>
                </td>
                <td
                  className={`whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums ${
                    tx.type === 'income' ? 'text-success' : 'text-danger'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'}
                  {formatCurrency(tx.amount, currency)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(tx)}
                      aria-label={`Edit ${tx.description}`}
                      className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-surface-3 hover:text-ink"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(tx)}
                      aria-label={`Delete ${tx.description}`}
                      className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {transactions.map((tx) => {
          const meta = getCategoryMeta(tx.category)
          const Icon = meta.icon
          return (
            <li
              key={tx.id}
              className={`rounded-2xl border border-border bg-surface p-4 shadow-card ${
                tx.id === highlightId ? 'ring-2 ring-brand/40' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <CategoryIcon category={tx.category} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{tx.description}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {formatDate(tx.date)} · {tx.paymentMethod}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge tone={tx.type === 'income' ? 'success' : 'danger'}>
                      <Icon className="h-3 w-3" aria-hidden="true" />
                      {tx.type === 'income' ? 'Income' : 'Expense'}
                    </Badge>
                    <span className="text-xs text-ink-muted">{tx.category}</span>
                  </div>
                </div>
                <span
                  className={`shrink-0 text-sm font-semibold tabular-nums ${
                    tx.type === 'income' ? 'text-success' : 'text-danger'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'}
                  {formatCurrency(tx.amount, currency)}
                </span>
              </div>
              <div className="mt-3 flex justify-end gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => onEdit(tx)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(tx)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-danger-soft hover:text-danger"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Delete
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}
