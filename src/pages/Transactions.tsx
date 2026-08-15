import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, ReceiptText } from 'lucide-react'
import type { Transaction } from '../types'
import { useFinance } from '../context/FinanceContext'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import {
  TransactionFilters,
  type TransactionFiltersState,
} from '../components/transactions/TransactionFilters'
import { DEFAULT_FILTERS } from '../types/filters'
import { TransactionTable } from '../components/transactions/TransactionTable'
import { TransactionFormModal } from '../components/transactions/TransactionFormModal'

export function Transactions() {
  const { transactions, settings, deleteTransaction } = useFinance()
  const [searchParams] = useSearchParams()
  const highlightId = searchParams.get('highlight') ?? undefined

  const [filters, setFilters] = useState<TransactionFiltersState>(DEFAULT_FILTERS)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState<Transaction | null>(null)

  function patchFilters(patch: Partial<TransactionFiltersState>) {
    setFilters((f) => ({ ...f, ...patch }))
  }

  const filtered = useMemo(() => {
    let list = [...transactions]

    if (filters.query.trim()) {
      const q = filters.query.trim().toLowerCase()
      list = list.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.paymentMethod.toLowerCase().includes(q) ||
          (t.notes ?? '').toLowerCase().includes(q),
      )
    }
    if (filters.from) list = list.filter((t) => t.date >= filters.from)
    if (filters.to) list = list.filter((t) => t.date <= filters.to)
    if (filters.category) list = list.filter((t) => t.category === filters.category)
    if (filters.type) list = list.filter((t) => t.type === filters.type)
    if (filters.paymentMethod) list = list.filter((t) => t.paymentMethod === filters.paymentMethod)

    switch (filters.sort) {
      case 'newest':
        list.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
        break
      case 'oldest':
        list.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
        break
      case 'highest':
        list.sort((a, b) => b.amount - a.amount)
        break
      case 'lowest':
        list.sort((a, b) => a.amount - b.amount)
        break
    }

    // Keep the highlighted transaction in view by forcing it to the top.
    if (highlightId) {
      const idx = list.findIndex((t) => t.id === highlightId)
      if (idx > 0) {
        const [highlighted] = list.splice(idx, 1)
        list.unshift(highlighted)
      }
    }

    return list
  }, [transactions, filters, highlightId])

  function openAdd() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(tx: Transaction) {
    setEditing(tx)
    setFormOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="Manage your income and expenses."
        actions={
          <Button onClick={openAdd} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
            Add Transaction
          </Button>
        }
      />

      {transactions.length === 0 ? (
        <EmptyState
          icon={<ReceiptText className="h-5 w-5" aria-hidden="true" />}
          title="No transactions yet"
          description="Start tracking your finances by adding your first transaction."
          action={
            <Button onClick={openAdd} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
              Add Transaction
            </Button>
          }
        />
      ) : (
        <>
          <TransactionFilters
            filters={filters}
            onChange={patchFilters}
            resultCount={filtered.length}
            totalCount={transactions.length}
          />

          {filtered.length === 0 ? (
            <EmptyState
              icon={<ReceiptText className="h-5 w-5" aria-hidden="true" />}
              title="No matching transactions"
              description="Try adjusting your search or clearing the active filters."
            />
          ) : (
            <TransactionTable
              transactions={filtered}
              currency={settings.currency}
              highlightId={highlightId}
              onEdit={openEdit}
              onDelete={setDeleting}
            />
          )}
        </>
      )}

      <TransactionFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        transaction={editing}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Delete Transaction"
        message={`Are you sure you want to delete "${deleting?.description}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) deleteTransaction(deleting.id)
          setDeleting(null)
        }}
      />
    </div>
  )
}
