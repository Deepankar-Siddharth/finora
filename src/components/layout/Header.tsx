import { useLocation, useNavigate } from 'react-router-dom'
import { Lock, Menu } from 'lucide-react'
import { NAV_ITEMS } from '../../constants'
import { useFinance } from '../../context/FinanceContext'
import { useAuth } from '../../context/AuthContext'
import { GlobalSearch } from './GlobalSearch'
import { ThemeToggle } from './ThemeToggle'

interface HeaderProps {
  onOpenMobileNav: () => void
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function Header({ onOpenMobileNav }: HeaderProps) {
  const { settings } = useFinance()
  const { pinEnabled, lock } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const currentLabel =
    NAV_ITEMS.find((item) =>
      item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path),
    )?.label ?? 'Finora'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-canvas/85 px-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        onClick={onOpenMobileNav}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink lg:hidden"
        aria-label="Open navigation menu"
      >
        <Menu className="h-4.5 w-4.5" aria-hidden="true" />
      </button>

      <h2 className="hidden text-sm font-semibold text-ink md:block lg:hidden xl:block">
        {currentLabel}
      </h2>

      <div className="flex flex-1 justify-end gap-2 sm:justify-center">
        <GlobalSearch />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {pinEnabled && (
          <button
            type="button"
            onClick={lock}
            aria-label="Lock Finora"
            title="Lock Finora"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <Lock className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
        )}
        <ThemeToggle />
        <button
          type="button"
          onClick={() => navigate('/settings')}
          aria-label="Open profile settings"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand transition-colors hover:ring-2 hover:ring-brand/30"
        >
          {getInitials(settings.name)}
        </button>
      </div>
    </header>
  )
}
