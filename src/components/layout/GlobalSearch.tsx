import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, CornerDownLeft, Search, Wallet2 } from 'lucide-react'
import { useFinance } from '../../context/FinanceContext'
import { formatCurrency } from '../../utils/currency'
import { formatShortDate } from '../../utils/dates'
import { CategoryIcon } from '../ui/CategoryIcon'

function matches(tx: { description: string; category: string; paymentMethod: string; notes?: string }, query: string): boolean {
  const q = query.toLowerCase()
  return (
    tx.description.toLowerCase().includes(q) ||
    tx.category.toLowerCase().includes(q) ||
    tx.paymentMethod.toLowerCase().includes(q) ||
    (tx.notes ?? '').toLowerCase().includes(q)
  )
}

export function GlobalSearch() {
  const { transactions, settings } = useFinance()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => {
    const q = query.trim()
    if (!q) return []
    return transactions
      .filter((t) => matches(t, q))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8)
  }, [transactions, query])

  // Keyboard shortcut to open the search (Ctrl/Cmd+K or "/").
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
      } else if (
        event.key === '/' &&
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLTextAreaElement) &&
        !(event.target instanceof HTMLSelectElement)
      ) {
        event.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) {
      setSelectedIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const openTransaction = useCallback(
    (id: string) => {
      setOpen(false)
      setQuery('')
      navigate(`/transactions?highlight=${encodeURIComponent(id)}`)
    },
    [navigate],
  )

  useEffect(() => {
    if (!open) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (event.key === 'Enter') {
        event.preventDefault()
        const target = results[selectedIndex]
        if (target) openTransaction(target.id)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, results, selectedIndex, openTransaction])

  return (
    <div className="relative w-full sm:max-w-sm">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9.5 w-full items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-ink-muted transition-colors hover:border-border-strong hover:text-ink-soft"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Search transactions"
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="flex-1 truncate text-left">
          {open ? '' : 'Search transactions…'}
        </span>
        <kbd className="hidden shrink-0 rounded border border-border bg-surface-2 px-1.5 py-0.5 font-sans text-[10px] text-ink-muted sm:inline-block">
          Ctrl K
        </kbd>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-40 mt-2">
          <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-pop">
            <div className="flex items-center gap-2 border-b border-border px-3">
              <Search className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setSelectedIndex(0)
                }}
                placeholder="Description, category, method, notes…"
                className="h-11 w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
                role="combobox"
                aria-label="Search transactions"
                aria-expanded={true}
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close search"
                className="text-xs text-ink-muted hover:text-ink"
              >
                Esc
              </button>
            </div>

            <div className="scrollbar-thin max-h-80 overflow-y-auto p-1.5" role="listbox">
              {query.trim() === '' ? (
                <p className="px-3 py-6 text-center text-sm text-ink-muted">
                  Type to search across your transactions.
                </p>
              ) : results.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-ink-muted">
                  No transactions match &ldquo;{query}&rdquo;.
                </p>
              ) : (
                results.map((tx, index) => (
                  <button
                    key={tx.id}
                    type="button"
                    role="option"
                    aria-selected={index === selectedIndex}
                    onClick={() => openTransaction(tx.id)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={[
                      'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left',
                      index === selectedIndex ? 'bg-brand-soft' : '',
                    ].join(' ')}
                  >
                    <CategoryIcon category={tx.category} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {tx.description}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted">
                        <CalendarDays className="h-3 w-3" aria-hidden="true" />
                        {formatShortDate(tx.date)} · {tx.category}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 text-sm font-medium ${
                        tx.type === 'income' ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount, settings.currency)}
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="flex items-center gap-3 border-t border-border bg-surface-2/60 px-3 py-1.5 text-[11px] text-ink-muted">
              <span className="inline-flex items-center gap-1">
                <CornerDownLeft className="h-3 w-3" aria-hidden="true" /> Open
              </span>
              <span>
                <kbd>↑</kbd> <kbd>↓</kbd> Navigate
              </span>
              <span className="ml-auto inline-flex items-center gap-1">
                <Wallet2 className="h-3 w-3" aria-hidden="true" /> {results.length} results
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
