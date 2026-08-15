import { useId, type ReactNode, type SelectHTMLAttributes } from 'react'
import { AlertCircle, ChevronDown } from 'lucide-react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  children: ReactNode
}

export function Select({ label, error, children, className = '', id, ...rest }: SelectProps) {
  const autoId = useId()
  const selectId = id ?? autoId

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-ink-soft">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={error ? true : undefined}
          className={[
            'h-9.5 w-full appearance-none rounded-lg border bg-surface px-3 pr-9 text-sm text-ink',
            'transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20',
            error ? 'border-danger focus:border-danger focus:ring-danger/20' : 'border-border',
            className,
          ].join(' ')}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
          aria-hidden="true"
        />
      </div>
      {error && (
        <p className="flex items-center gap-1 text-xs text-danger">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  )
}
