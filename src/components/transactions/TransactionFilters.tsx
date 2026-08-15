import { RotateCcw, Search } from 'lucide-react'
import { ALL_CATEGORIES, PAYMENT_METHODS } from '../../constants/categories'
import type { TransactionFiltersState } from '../../types/filters'
import { DEFAULT_FILTERS } from '../../types/filters'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

export type { TransactionFiltersState }

interface TransactionFiltersProps {
  filters: TransactionFiltersState
  onChange: (patch: Partial<TransactionFiltersState>) => void
  resultCount: number
  totalCount: number
}

export function TransactionFilters({ filters, onChange, resultCount, totalCount }: TransactionFiltersProps) {
  const isFiltered =
    filters.query !== '' ||
    filters.from !== '' ||
    filters.to !== '' ||
    filters.category !== '' ||
    filters.type !== '' ||
    filters.paymentMethod !== ''

  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Input
          label="Search"
          placeholder="Description, category, method, notes…"
          value={filters.query}
          onChange={(e) => onChange({ query: e.target.value })}
          icon={<Search className="h-4 w-4" aria-hidden="true" />}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="From"
            type="date"
            value={filters.from}
            max={filters.to || undefined}
            onChange={(e) => onChange({ from: e.target.value })}
          />
          <Input
            label="To"
            type="date"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(e) => onChange({ to: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Select
          label="Category"
          value={filters.category}
          onChange={(e) => onChange({ category: e.target.value })}
        >
          <option value="">All categories</option>
          {ALL_CATEGORIES.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select label="Type" value={filters.type} onChange={(e) => onChange({ type: e.target.value as TransactionFiltersState['type'] })}>
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </Select>
        <Select
          label="Payment Method"
          value={filters.paymentMethod}
          onChange={(e) => onChange({ paymentMethod: e.target.value })}
        >
          <option value="">All methods</option>
          {PAYMENT_METHODS.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </Select>
        <Select label="Sort by" value={filters.sort} onChange={(e) => onChange({ sort: e.target.value as TransactionFiltersState['sort'] })}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="highest">Highest amount</option>
          <option value="lowest">Lowest amount</option>
        </Select>
      </div>

      <div className="flex items-center justify-between text-xs text-ink-muted">
        <span>
          Showing <span className="font-medium text-ink-soft">{resultCount}</span> of{' '}
          <span className="font-medium text-ink-soft">{totalCount}</span> transactions
        </span>
        {isFiltered && (
          <button
            type="button"
            onClick={() => onChange({ ...DEFAULT_FILTERS })}
            className="inline-flex items-center gap-1 font-medium text-brand transition-colors hover:text-brand/80"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}
