import { useId, type InputHTMLAttributes } from 'react'

interface PinFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
}

/** Numeric, password-styled input for the site secret. */
export function PinField({ label, value, onChange, error, className = '', id, ...rest }: PinFieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const describedBy = error ? `${inputId}-error` : undefined

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-ink-soft">
        {label}
      </label>
      <input
        id={inputId}
        type="password"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="• • • • • •"
        maxLength={8}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 8))}
        className={[
          'h-13 w-full rounded-xl border bg-surface px-4 text-center text-2xl font-semibold tracking-[0.5em] text-ink placeholder:text-ink-muted/40',
          'transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20',
          error ? 'border-danger focus:border-danger focus:ring-danger/20' : 'border-border',
          className,
        ].join(' ')}
        {...rest}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-center text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
