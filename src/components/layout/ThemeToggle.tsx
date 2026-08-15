import { Moon, Sun } from 'lucide-react'
import { useFinance } from '../../context/FinanceContext'
import type { ThemePreference } from '../../types'

/** Toggle between light and dark. System preference is resolved first. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { settings, updateSettings } = useFinance()
  const isDark = settings.theme === 'dark'

  // When following system, pick the opposite of the resolved value.
  const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolvedDark = settings.theme === 'system' ? isSystemDark : isDark
  const next: ThemePreference = resolvedDark ? 'light' : 'dark'

  return (
    <button
      type="button"
      onClick={() => updateSettings({ theme: next })}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink ${className}`}
    >
      {resolvedDark ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  )
}
