import { useEffect, useMemo, useState } from 'react'
import { ArrowDownToLine, ArrowUpFromLine, Wallet } from 'lucide-react'
import type { PaymentMethod, Transaction, TransactionType } from '../../types'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '../../constants/categories'
import { useFinance } from '../../context/FinanceContext'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { createId } from '../../utils/id'
import { parseAmount } from '../../utils/currency'
import { todayISO } from '../../utils/dates'

interface TransactionFormModalProps {
  open: boolean
  onClose: () => void
  /** Existing transaction to edit; when absent the form starts blank. */
  transaction?: Transaction | null
}

interface FormState {
  type: TransactionType
  amount: string
  category: string
  date: string
  description: string
  paymentMethod: PaymentMethod
  notes: string
}

interface FormErrors {
  amount?: string
  category?: string
  date?: string
  description?: string
  paymentMethod?: string
}

function blankForm(): FormState {
  return {
    type: 'expense',
    amount: '',
    category: '',
    date: todayISO(),
    description: '',
    paymentMethod: 'UPI',
    notes: '',
  }
}

function toFormState(tx: Transaction): FormState {
  return {
    type: tx.type,
    amount: String(tx.amount),
    category: tx.category,
    date: tx.date,
    description: tx.description,
    paymentMethod: tx.paymentMethod,
    notes: tx.notes ?? '',
  }
}

export function TransactionFormModal({ open, onClose, transaction }: TransactionFormModalProps) {
  const { addTransaction, updateTransaction } = useFinance()
  const [form, setForm] = useState<FormState>(blankForm())
  const [errors, setErrors] = useState<FormErrors>({})

  // Re-initialize the form whenever the modal opens for a given target.
  useEffect(() => {
    if (open) {
      setForm(transaction ? toFormState(transaction) : blankForm())
      setErrors({})
    }
  }, [open, transaction])

  const categories = useMemo(
    () => (form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES),
    [form.type],
  )

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const next: FormErrors = {}
    if (parseAmount(form.amount) === null) {
      next.amount = 'Enter a valid amount greater than zero.'
    }
    if (!form.category) next.category = 'Choose a category.'
    if (!form.date) {
      next.date = 'Choose a date.'
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
      next.date = 'Enter a valid date.'
    }
    if (form.description.trim().length === 0) {
      next.description = 'Add a short description.'
    }
    if (!form.paymentMethod) next.paymentMethod = 'Choose a payment method.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    const amount = parseAmount(form.amount)
    if (amount === null) return

    const now = todayISO()
    const payload: Transaction = {
      id: transaction?.id ?? createId(),
      type: form.type,
      amount,
      category: form.category,
      date: form.date,
      description: form.description.trim(),
      paymentMethod: form.paymentMethod,
      notes: form.notes.trim() || undefined,
      createdAt: transaction?.createdAt ?? now,
    }

    if (transaction) {
      updateTransaction(payload)
    } else {
      addTransaction(payload)
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={transaction ? 'Edit Transaction' : 'Add Transaction'}
      description={
        transaction
          ? 'Update the details of this transaction.'
          : 'Record an income or expense to keep your finances accurate.'
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} icon={<Wallet className="h-4 w-4" aria-hidden="true" />}>
            {transaction ? 'Save Changes' : 'Add Transaction'}
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
        {/* Type toggle */}
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-ink-soft">Transaction Type</legend>
          <div role="group" aria-label="Transaction type" className="grid grid-cols-2 gap-2">
            <button
              type="button"
              aria-pressed={form.type === 'expense'}
              onClick={() => set('type', 'expense')}
              className={[
                'flex h-10 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors',
                form.type === 'expense'
                  ? 'border-danger/30 bg-danger-soft text-danger'
                  : 'border-border text-ink-soft hover:bg-surface-2',
              ].join(' ')}
            >
              <ArrowUpFromLine className="h-4 w-4" aria-hidden="true" />
              Expense
            </button>
            <button
              type="button"
              aria-pressed={form.type === 'income'}
              onClick={() => set('type', 'income')}
              className={[
                'flex h-10 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors',
                form.type === 'income'
                  ? 'border-success/30 bg-success-soft text-success'
                  : 'border-border text-ink-soft hover:bg-surface-2',
              ].join(' ')}
            >
              <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
              Income
            </button>
          </div>
        </fieldset>

        <Input
          label="Amount"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={form.amount}
          onChange={(e) => set('amount', e.target.value)}
          error={errors.amount}
          icon={<span className="text-sm font-medium text-ink-muted">₹</span>}
        />

        <Select
          label="Category"
          value={form.category}
          onChange={(e) => set('category', e.target.value)}
          error={errors.category}
        >
          <option value="" disabled>
            Select a category
          </option>
          {categories.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Date"
            type="date"
            value={form.date}
            max={todayISO()}
            onChange={(e) => set('date', e.target.value)}
            error={errors.date}
          />
          <Select
            label="Payment Method"
            value={form.paymentMethod}
            onChange={(e) => set('paymentMethod', e.target.value as PaymentMethod)}
            error={errors.paymentMethod}
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </Select>
        </div>

        <Input
          label="Description"
          placeholder="e.g. Monthly grocery shopping"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          error={errors.description}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="tx-notes" className="text-sm font-medium text-ink-soft">
            Notes <span className="font-normal text-ink-muted">(optional)</span>
          </label>
          <textarea
            id="tx-notes"
            rows={2}
            placeholder="Anything you want to remember about this transaction"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
      </form>
    </Modal>
  )
}
