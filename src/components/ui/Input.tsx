import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: ReactNode
  error?: string
  icon?: ReactNode
}

export function Input({
  label,
  hint,
  error,
  icon,
  className = '',
  id,
  ...rest
}: InputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink-soft">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-muted">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={[
            'h-9.5 w-full rounded-lg border bg-surface px-3 text-sm text-ink placeholder:text-ink-muted',
            'transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20',
            icon ? 'pl-9' : '',
            error ? 'border-danger focus:border-danger focus:ring-danger/20' : 'border-border',
            className,
          ].join(' ')}
          {...rest}
        />
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="flex items-center gap-1 text-xs text-danger">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
