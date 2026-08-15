import { useMemo, useState } from 'react'
import { Plus, Repeat } from 'lucide-react'
import type { RecurringTransaction } from '../types'
import { useFinance } from '../context/FinanceContext'
import { useToast } from '../context/ToastContext'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { RecurringCard } from '../components/recurring/RecurringCard'
import { RecurringFormModal } from '../components/recurring/RecurringFormModal'
import { formatCurrency } from '../utils/currency'

export function Recurring() {
  const { recurring, settings, deleteRecurring, generateOccurrence } = useFinance()
  const { toast } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<RecurringTransaction | null>(null)
  const [deleting, setDeleting] = useState<RecurringTransaction | null>(null)

  const sorted = useMemo(
    () => [...recurring].sort((a, b) => a.nextDate.localeCompare(b.nextDate)),
    [recurring],
  )

  function handleGenerate(item: RecurringTransaction) {
    generateOccurrence(item.id)
    toast(
      `${item.name} added as a ${item.type} of ${formatCurrency(item.amount, settings.currency)}.`,
    )
  }

  return (
    <div>
      <PageHeader
        title="Recurring Transactions"
        description="Automate recurring income and expenses like rent, salary and subscriptions."
        actions={
          <Button
            onClick={() => {
              setEditing(null)
              setModalOpen(true)
            }}
            icon={<Plus className="h-4 w-4" aria-hidden="true" />}
          >
            Add Recurring
          </Button>
        }
      />

      {sorted.length === 0 ? (
        <EmptyState
          icon={<Repeat className="h-5 w-5" aria-hidden="true" />}
          title="No recurring transactions"
          description="Add a recurring income or expense, then generate occurrences whenever they land."
          action={
            <Button
              onClick={() => {
                setEditing(null)
                setModalOpen(true)
              }}
              icon={<Plus className="h-4 w-4" aria-hidden="true" />}
            >
              Add Recurring
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((item) => (
            <RecurringCard
              key={item.id}
              item={item}
              onEdit={(i) => {
                setEditing(i)
                setModalOpen(true)
              }}
              onDelete={setDeleting}
              onGenerate={handleGenerate}
            />
          ))}
        </div>
      )}

      <RecurringFormModal open={modalOpen} onClose={() => setModalOpen(false)} item={editing} />

      <ConfirmDialog
        open={deleting !== null}
        title="Delete Recurring Transaction"
        message={`Delete "${deleting?.name}"? This removes the schedule but not transactions already recorded.`}
        confirmLabel="Delete"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) deleteRecurring(deleting.id)
          setDeleting(null)
        }}
      />
    </div>
  )
}
