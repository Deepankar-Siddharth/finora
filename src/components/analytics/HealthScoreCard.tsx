import { HeartPulse } from 'lucide-react'
import { useFinance } from '../../context/FinanceContext'
import { Card } from '../ui/Card'
import { ProgressBar } from '../ui/ProgressBar'
import {
  getFinancialHealthScore,
  getHealthBreakdown,
  getHealthLabel,
} from '../../utils/analytics'

/** 0-100 health estimate built from savings rate, expense ratio and budget adherence. */
export function HealthScoreCard() {
  const { transactions, budgets } = useFinance()
  const factors = getFinancialHealthScore(transactions, budgets)
  const breakdown = getHealthBreakdown(factors)
  const label = getHealthLabel(factors.score)

  return (
    <Card className="flex flex-col">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
          <HeartPulse className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-ink">Financial Health</h2>
          <p className="text-sm text-ink-muted">Score based on this month&apos;s activity</p>
        </div>
      </div>

      <div className="flex items-end gap-3">
        <span className="text-5xl font-semibold tracking-tight text-ink">{factors.score}</span>
        <span
          className={`mb-1.5 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
            factors.score >= 60
              ? 'bg-success-soft text-success'
              : factors.score >= 40
                ? 'bg-warning-soft text-warning'
                : 'bg-danger-soft text-danger'
          }`}
        >
          {label}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {breakdown.map((factor) => (
          <div key={factor.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-ink-soft">{factor.label}</span>
              <span className="font-medium tabular-nums text-ink">{factor.score}</span>
            </div>
            <ProgressBar value={factor.score} status="ok" label={factor.label} />
          </div>
        ))}
      </div>

      <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-ink-muted">
        Your financial health score is an estimate for informational purposes only. It is not
        professional financial advice.
      </p>
    </Card>
  )
}
