import { useEffect, useMemo, useState } from 'react'
import { Wallet } from 'lucide-react'
import type { Budget } from '../../types'
import { EXPENSE_CATEGORIES } from '../../constants/categories'
import { useFinance } from '../../context/FinanceContext'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { createId } from '../../utils/id'
import { currentMonthKey, formatMonthLabel, shiftMonth } from '../../utils/dates'

interface BudgetFormModalProps {
  open: boolean
  onClose: () => void
  budget?: Budget | null
}

interface FormState {
  category: string
  limit: string
  month: string
}

const EMPTY: FormState = { category: '', limit: '', month: currentMonthKey() }

export function BudgetFormModal({ open, onClose, budget }: BudgetFormModalProps) {
  const { budgets, addBudget, updateBudget } = useFinance()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  useEffect(() => {
    if (open) {
      setForm(
        budget
          ? { category: budget.category, limit: String(budget.limit), month: budget.month }
          : EMPTY,
      )
      setErrors({})
    }
  }, [open, budget])

  const months = useMemo(() => {
    const current = currentMonthKey()
    const list: string[] = []
    for (let offset = 11; offset >= 0; offset--) list.push(shiftMonth(current, -offset))
    return list
  }, [])

  const usedCategories = new Set(
    budgets.filter((b) => b.month === form.month && b.id !== budget?.id).map((b) => b.category),
  )

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function handleSubmit() {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!form.category) next.category = 'Choose a category.'
    const limit = Number(form.limit)
    if (!Number.isFinite(limit) || limit <= 0) next.limit = 'Enter a monthly limit greater than zero.'
    if (!/^\d{4}-\d{2}$/.test(form.month)) next.month = 'Choose a month.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    const payload: Budget = {
      id: budget?.id ?? createId(),
      category: form.category,
      limit: Math.round(limit),
      month: form.month,
    }

    if (budget) updateBudget(payload)
    else addBudget(payload)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={budget ? 'Edit Budget' : 'Create Budget'}
      description="Set a monthly spending limit for a category."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} icon={<Wallet className="h-4 w-4" aria-hidden="true" />}>
            {budget ? 'Save Changes' : 'Create Budget'}
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
        <Select label="Category" value={form.category} onChange={(e) => setField('category', e.target.value)} error={errors.category}>
          <option value="" disabled>
            Select a category
          </option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c.name} value={c.name} disabled={usedCategories.has(c.name)}>
              {c.name}
              {usedCategories.has(c.name) ? ' (already budgeted)' : ''}
            </option>
          ))}
        </Select>

        <Input
          label="Monthly Limit"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={form.limit}
          onChange={(e) => setField('limit', e.target.value)}
          error={errors.limit}
          icon={<span className="text-sm font-medium text-ink-muted">₹</span>}
        />

        <Select label="Month" value={form.month} onChange={(e) => setField('month', e.target.value)} error={errors.month}>
          {months.map((month) => (
            <option key={month} value={month}>
              {formatMonthLabel(month)}
            </option>
          ))}
        </Select>
      </form>
    </Modal>
  )
}
