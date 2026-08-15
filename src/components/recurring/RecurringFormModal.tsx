import { useEffect, useState } from 'react'
import { Repeat } from 'lucide-react'
import type { RecurringFrequency, RecurringTransaction, TransactionType } from '../../types'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, RECURRING_FREQUENCIES, FREQUENCY_LABELS } from '../../constants/categories'
import { useFinance } from '../../context/FinanceContext'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { createId } from '../../utils/id'
import { todayISO } from '../../utils/dates'

interface RecurringFormModalProps {
  open: boolean
  onClose: () => void
  item?: RecurringTransaction | null
}

interface FormState {
  name: string
  amount: string
  type: TransactionType
  category: string
  frequency: RecurringFrequency
  nextDate: string
}

const EMPTY: FormState = {
  name: '',
  amount: '',
  type: 'expense',
  category: '',
  frequency: 'monthly',
  nextDate: todayISO(),
}

export function RecurringFormModal({ open, onClose, item }: RecurringFormModalProps) {
  const { addRecurring, updateRecurring } = useFinance()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  useEffect(() => {
    if (open) {
      setForm(
        item
          ? {
              name: item.name,
              amount: String(item.amount),
              type: item.type,
              category: item.category,
              frequency: item.frequency,
              nextDate: item.nextDate,
            }
          : EMPTY,
      )
      setErrors({})
    }
  }, [open, item])

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function handleSubmit() {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!form.name.trim()) next.name = 'Give this transaction a name.'
    const amount = Number(form.amount)
    if (!Number.isFinite(amount) || amount <= 0) next.amount = 'Enter an amount greater than zero.'
    if (!form.category) next.category = 'Choose a category.'
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.nextDate)) next.nextDate = 'Choose a valid date.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    const payload: RecurringTransaction = {
      id: item?.id ?? createId(),
      name: form.name.trim(),
      amount: Math.round(amount),
      type: form.type,
      category: form.category,
      frequency: form.frequency,
      nextDate: form.nextDate,
    }

    if (item) updateRecurring(payload)
    else addRecurring(payload)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? 'Edit Recurring Transaction' : 'Add Recurring Transaction'}
      description="A transaction that repeats on a schedule."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} icon={<Repeat className="h-4 w-4" aria-hidden="true" />}>
            {item ? 'Save Changes' : 'Add Transaction'}
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
        noValidate
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Name"
            placeholder="e.g. Netflix"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            error={errors.name}
          />
          <Input
            label="Amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setField('amount', e.target.value)}
            error={errors.amount}
            icon={<span className="text-sm font-medium text-ink-muted">₹</span>}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Type" value={form.type} onChange={(e) => setField('type', e.target.value as TransactionType)}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </Select>
          <Select label="Category" value={form.category} onChange={(e) => setField('category', e.target.value)} error={errors.category}>
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Frequency"
            value={form.frequency}
            onChange={(e) => setField('frequency', e.target.value as RecurringFrequency)}
          >
            {RECURRING_FREQUENCIES.map((freq) => (
              <option key={freq} value={freq}>
                {FREQUENCY_LABELS[freq]}
              </option>
            ))}
          </Select>
          <Input
            label="Next Occurrence Date"
            type="date"
            value={form.nextDate}
            onChange={(e) => setField('nextDate', e.target.value)}
            error={errors.nextDate}
          />
        </div>
      </form>
    </Modal>
  )
}
