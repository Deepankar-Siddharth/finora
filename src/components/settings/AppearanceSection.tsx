import { Laptop, Moon, Sun } from 'lucide-react'
import type { ThemePreference } from '../../types'
import { useFinance } from '../../context/FinanceContext'
import { useToast } from '../../context/ToastContext'
import { Card } from '../ui/Card'

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun; description: string }[] = [
  { value: 'light', label: 'Light', icon: Sun, description: 'Bright and airy' },
  { value: 'dark', label: 'Dark', icon: Moon, description: 'Easy on the eyes' },
  { value: 'system', label: 'System', icon: Laptop, description: 'Follow your device' },
]

export function AppearanceSection() {
  const { settings, updateSettings } = useFinance()
  const { toast } = useToast()

  return (
    <Card>
      <div className="mb-5 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
          <Laptop className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-ink">Appearance</h2>
          <p className="text-sm text-ink-muted">Choose how Finora looks.</p>
        </div>
      </div>

      <div role="radiogroup" aria-label="Theme" className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
        {OPTIONS.map((option) => {
          const Icon = option.icon
          const selected = settings.theme === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                updateSettings({ theme: option.value })
                toast(`Theme set to ${option.label.toLowerCase()}.`)
              }}
              className={[
                'flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors',
                selected
                  ? 'border-brand bg-brand-soft/60 ring-1 ring-brand/40'
                  : 'border-border hover:border-border-strong hover:bg-surface-2/50',
              ].join(' ')}
            >
              <Icon className={`h-5 w-5 ${selected ? 'text-brand' : 'text-ink-muted'}`} aria-hidden="true" />
              <span>
                <span className="block text-sm font-medium text-ink">{option.label}</span>
                <span className="block text-xs text-ink-muted">{option.description}</span>
              </span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
