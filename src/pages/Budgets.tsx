import { useMemo, useState } from 'react'
import { PiggyBank, Plus, Target } from 'lucide-react'
import type { Budget, SavingsGoal } from '../types'
import { useFinance } from '../context/FinanceContext'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { MonthSelector } from '../components/dashboard/MonthSelector'
import { BudgetCard } from '../components/budgets/BudgetCard'
import { BudgetFormModal } from '../components/budgets/BudgetFormModal'
import { GoalCard } from '../components/goals/GoalCard'
import { GoalFormModal } from '../components/goals/GoalFormModal'
import { currentMonthKey } from '../utils/dates'

export function Budgets() {
  const { budgets, goals, deleteBudget, deleteGoal } = useFinance()
  const [monthKey, setMonthKey] = useState(currentMonthKey())

  const [budgetModalOpen, setBudgetModalOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)

  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null)

  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null)
  const [deletingGoal, setDeletingGoal] = useState<SavingsGoal | null>(null)

  const monthBudgets = useMemo(
    () => budgets.filter((b) => b.month === monthKey),
    [budgets, monthKey],
  )

  return (
    <div>
      <PageHeader
        title="Budgets"
        description="Set monthly limits and keep your spending in check."
        actions={
          <Button onClick={() => { setEditingBudget(null); setBudgetModalOpen(true) }} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
            Create Budget
          </Button>
        }
      />

      <div className="mb-6">
        <MonthSelector value={monthKey} onChange={setMonthKey} />
      </div>

      {/* Monthly budgets */}
      <section aria-labelledby="budgets-heading" className="mb-10">
        <h2 id="budgets-heading" className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Monthly Budgets
        </h2>

        {monthBudgets.length === 0 ? (
          <EmptyState
            icon={<PiggyBank className="h-5 w-5" aria-hidden="true" />}
            title="No budgets for this month"
            description="Create a budget to set a spending limit for a category."
            action={
              <Button onClick={() => { setEditingBudget(null); setBudgetModalOpen(true) }} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
                Create Budget
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {monthBudgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                onEdit={(b) => { setEditingBudget(b); setBudgetModalOpen(true) }}
                onDelete={setDeletingBudget}
              />
            ))}
          </div>
        )}
      </section>

      {/* Savings goals */}
      <section aria-labelledby="goals-heading">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="goals-heading" className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Savings Goals
          </h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { setEditingGoal(null); setGoalModalOpen(true) }}
            icon={<Plus className="h-3.5 w-3.5" aria-hidden="true" />}
          >
            Add Goal
          </Button>
        </div>

        {goals.length === 0 ? (
          <EmptyState
            icon={<Target className="h-5 w-5" aria-hidden="true" />}
            title="No savings goals yet"
            description="Create a goal and watch your progress grow as you save."
            action={
              <Button onClick={() => { setEditingGoal(null); setGoalModalOpen(true) }} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
                Create Goal
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={(g) => { setEditingGoal(g); setGoalModalOpen(true) }}
                onDelete={setDeletingGoal}
              />
            ))}
          </div>
        )}
      </section>

      <BudgetFormModal
        open={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        budget={editingBudget}
      />
      <GoalFormModal
        open={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        goal={editingGoal}
      />

      <ConfirmDialog
        open={deletingBudget !== null}
        title="Delete Budget"
        message={`Delete the ${deletingBudget?.category} budget? This action cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setDeletingBudget(null)}
        onConfirm={() => {
          if (deletingBudget) deleteBudget(deletingBudget.id)
          setDeletingBudget(null)
        }}
      />
      <ConfirmDialog
        open={deletingGoal !== null}
        title="Delete Goal"
        message={`Delete the savings goal "${deletingGoal?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setDeletingGoal(null)}
        onConfirm={() => {
          if (deletingGoal) deleteGoal(deletingGoal.id)
          setDeletingGoal(null)
        }}
      />
    </div>
  )
}
