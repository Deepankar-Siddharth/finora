import { useEffect, useState } from 'react'
import { Target } from 'lucide-react'
import type { SavingsGoal } from '../../types'
import { useFinance } from '../../context/FinanceContext'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { createId } from '../../utils/id'
import { todayISO } from '../../utils/dates'

interface GoalFormModalProps {
  open: boolean
  onClose: () => void
  goal?: SavingsGoal | null
}

interface FormState {
  name: string
  target: string
  current: string
  targetDate: string
}

const EMPTY: FormState = { name: '', target: '', current: '0', targetDate: '' }

export function GoalFormModal({ open, onClose, goal }: GoalFormModalProps) {
  const { addGoal, updateGoal } = useFinance()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  useEffect(() => {
    if (open) {
      setForm(
        goal
          ? {
              name: goal.name,
              target: String(goal.target),
              current: String(goal.current),
              targetDate: goal.targetDate ?? '',
            }
          : EMPTY,
      )
      setErrors({})
    }
  }, [open, goal])

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function handleSubmit() {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!form.name.trim()) next.name = 'Give your goal a name.'
    const target = Number(form.target)
    if (!Number.isFinite(target) || target <= 0) next.target = 'Enter a target greater than zero.'
    const current = Number(form.current)
    if (!Number.isFinite(current) || current < 0) next.current = 'Enter a valid current amount.'
    if (form.targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(form.targetDate)) {
      next.targetDate = 'Enter a valid date.'
    }
    setErrors(next)
    if (Object.keys(next).length > 0) return

    const now = todayISO()
    const payload: SavingsGoal = {
      id: goal?.id ?? createId(),
      name: form.name.trim(),
      target: Math.round(target),
      current: Math.round(current),
      targetDate: form.targetDate || undefined,
      createdAt: goal?.createdAt ?? now,
    }

    if (goal) updateGoal(payload)
    else addGoal(payload)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={goal ? 'Edit Goal' : 'Create Goal'}
      description="Define a target amount and track your progress."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} icon={<Target className="h-4 w-4" aria-hidden="true" />}>
            {goal ? 'Save Changes' : 'Create Goal'}
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
        <Input
          label="Goal Name"
          placeholder="e.g. Emergency Fund"
          value={form.name}
          onChange={(e) => setField('name', e.target.value)}
          error={errors.name}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Target Amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.target}
            onChange={(e) => setField('target', e.target.value)}
            error={errors.target}
            icon={<span className="text-sm font-medium text-ink-muted">₹</span>}
          />
          <Input
            label="Current Amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.current}
            onChange={(e) => setField('current', e.target.value)}
            error={errors.current}
            icon={<span className="text-sm font-medium text-ink-muted">₹</span>}
          />
        </div>
        <Input
          label="Target Date (optional)"
          type="date"
          value={form.targetDate}
          onChange={(e) => setField('targetDate', e.target.value)}
          error={errors.targetDate}
        />
      </form>
    </Modal>
  )
}
