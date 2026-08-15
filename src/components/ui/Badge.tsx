import type { HTMLAttributes, ReactNode } from 'react'

type Tone = 'neutral' | 'success' | 'danger' | 'warning' | 'info'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
  children: ReactNode
}

const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-ink-soft border border-border',
  success: 'bg-success-soft text-success border border-success/20',
  danger: 'bg-danger-soft text-danger border border-danger/20',
  warning: 'bg-warning-soft text-warning border border-warning/20',
  info: 'bg-info-soft text-info border border-info/20',
}

export function Badge({ tone = 'neutral', children, className = '', ...rest }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  )
}
