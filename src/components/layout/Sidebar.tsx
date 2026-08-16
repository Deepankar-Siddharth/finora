import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { CircleHelp, Lock, LogIn, Wallet } from 'lucide-react'
import { NAV_ITEMS, APP_NAME, SYNC_STATUS_META } from '../../constants'
import { useFinance } from '../../context/FinanceContext'
import { useAuth } from '../../auth/AuthContext'
import { ThemeToggle } from './ThemeToggle'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

interface SidebarProps {
  onNavigate?: () => void
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

export function Sidebar({ onNavigate }: SidebarProps) {
  const { settings, syncStatus, syncNow } = useFinance()
  const { profile, lock } = useAuth()
  const [helpOpen, setHelpOpen] = useState(false)
  const displayName = profile?.name || settings.name

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
          <Wallet className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <span className="text-lg font-semibold tracking-tight text-ink">{APP_NAME}</span>
      </div>

      {/* Navigation */}
      <nav aria-label="Main navigation" className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onNavigate}
              className={({ isActive }) =>
                [
                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-soft text-brand'
                    : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
                ].join(' ')
              }
            >
              <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3">
        {syncStatus !== 'disabled' && (
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={syncNow}
              disabled={syncStatus === 'syncing'}
              title={syncStatus === 'syncing' ? 'Syncing…' : 'Sync now'}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-surface-2"
            >
              <Badge tone={SYNC_STATUS_META[syncStatus].tone}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                {SYNC_STATUS_META[syncStatus].label}
              </Badge>
            </button>
          </div>
        )}

        <div className="mb-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="inline-flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <CircleHelp className="h-4.5 w-4.5" aria-hidden="true" />
            Help
          </button>
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-2">
          <NavLink
            to="/settings"
            onClick={onNavigate}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-2"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand">
              {getInitials(displayName)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-ink">{displayName}</span>
              <span className="block text-xs text-ink-muted">View settings</span>
            </span>
            <LogIn className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
          </NavLink>
          <button
            type="button"
            onClick={lock}
            title="Lock Finora"
            aria-label="Lock Finora"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <Lock className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <Modal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="About Finora"
        size="sm"
        footer={
          <Button variant="secondary" onClick={() => setHelpOpen(false)}>
            Got it
          </Button>
        }
      >
        <div className="space-y-3 text-sm leading-relaxed text-ink-soft">
          <p>
            Finora is a personal finance dashboard that keeps your income, expenses, budgets and
            savings in one place.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>All data lives in your browser&apos;s local storage.</li>
            <li>Nothing is sent to a server — your finances stay private.</li>
            <li>Use the search in the header to find any transaction instantly.</li>
          </ul>
        </div>
      </Modal>
    </div>
  )
}
