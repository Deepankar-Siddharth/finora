import { useMemo, useState, useRef, useEffect } from 'react'
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { currentMonthKey, formatMonthLabel, shiftMonth } from '../../utils/dates'

interface MonthSelectorProps {
  value: string
  onChange: (monthKey: string) => void
}

/** Month picker used by the dashboard: arrows + a dropdown to jump months. */
export function MonthSelector({ value, onChange }: MonthSelectorProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const currentMonth = currentMonthKey()

  const months = useMemo(() => {
    const list: string[] = []
    for (let offset = 11; offset >= 0; offset--) {
      list.push(shiftMonth(currentMonth, -offset))
    }
    return list
  }, [currentMonth])

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const canGoNext = value < currentMonth
  const canGoBack = value > shiftMonth(currentMonth, -11)

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => canGoBack && onChange(shiftMonth(value, -1))}
          disabled={!canGoBack}
          aria-label="Previous month"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Selected month: ${formatMonthLabel(value)}. Change month.`}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-ink transition-colors hover:border-border-strong"
        >
          <Calendar className="h-4 w-4 text-ink-muted" aria-hidden="true" />
          <span className="whitespace-nowrap">{formatMonthLabel(value)}</span>
          <ChevronDown className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => canGoNext && onChange(shiftMonth(value, 1))}
          disabled={!canGoNext}
          aria-label="Next month"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div
          role="listbox"
          aria-label="Select a month"
          className="absolute left-0 top-full z-30 mt-2 max-h-64 w-52 overflow-y-auto rounded-xl border border-border bg-surface p-1.5 shadow-pop"
        >
          {months.map((month) => (
            <button
              key={month}
              type="button"
              role="option"
              aria-selected={month === value}
              onClick={() => {
                onChange(month)
                setOpen(false)
              }}
              className={[
                'block w-full rounded-lg px-3 py-2 text-left text-sm',
                month === value
                  ? 'bg-brand-soft font-medium text-brand'
                  : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
              ].join(' ')}
            >
              {formatMonthLabel(month)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
