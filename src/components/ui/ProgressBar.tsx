import type { BudgetStatus } from '../../types'

interface ProgressBarProps {
  /** Percentage 0-100. */
  value: number
  status?: BudgetStatus
  className?: string
  label?: string
}

const STATUS_COLORS: Record<BudgetStatus, string> = {
  ok: 'bg-brand',
  almost: 'bg-warning',
  exceeded: 'bg-danger',
}

/** Accessible progress indicator whose color reflects budget status. */
export function ProgressBar({ value, status = 'ok', className = '', label }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={`h-2 w-full overflow-hidden rounded-full bg-surface-3 ${className}`}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${STATUS_COLORS[status]}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
