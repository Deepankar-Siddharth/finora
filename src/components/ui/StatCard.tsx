import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Card } from './Card'

type Tone = 'brand' | 'success' | 'danger' | 'info' | 'warning'

interface StatCardProps {
  label: string
  value: string
  icon: ReactNode
  tone?: Tone
  /** Delta shown next to the label (e.g. +8.4%). */
  delta?: number | null
  deltaLabel?: string
  /** Whether a positive delta is good (true) or bad (false). */
  deltaPositiveIsGood?: boolean
  /** Custom footer line (e.g. savings rate). */
  footer?: ReactNode
}

const TONE_CLASSES: Record<Tone, string> = {
  brand: 'bg-brand-soft text-brand',
  success: 'bg-success-soft text-success',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  warning: 'bg-warning-soft text-warning',
}

export function StatCard({
  label,
  value,
  icon,
  tone = 'brand',
  delta,
  deltaLabel = 'vs last month',
  deltaPositiveIsGood = true,
  footer,
}: StatCardProps) {
  const hasDelta = delta !== null && delta !== undefined && Number.isFinite(delta)
  const positive = hasDelta ? delta >= 0 : false
  const deltaGood = hasDelta ? (deltaPositiveIsGood ? positive : !positive) : false

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-ink-muted">{label}</span>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONE_CLASSES[tone]}`}>
          {icon}
        </span>
      </div>

      <div>
        <p className="text-2xl font-semibold tracking-tight text-ink">{value}</p>
        {hasDelta && (
          <p className="mt-1.5 flex items-center gap-1 text-xs">
            <span
              className={`inline-flex items-center gap-0.5 font-medium ${
                deltaGood ? 'text-success' : 'text-danger'
              }`}
            >
              {positive ? (
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {Math.abs(delta).toFixed(1)}%
            </span>
            <span className="text-ink-muted">{deltaLabel}</span>
          </p>
        )}
        {footer}
      </div>
    </Card>
  )
}
