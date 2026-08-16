import { useEffect, useState, type FormEvent } from 'react'
import { Wallet } from 'lucide-react'
import { useAuth } from './AuthContext'
import { PinField } from './PinField'
import { Button } from '../components/ui/Button'

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 30_000

/** Sign in with the PIN created during onboarding. */
export function LoginScreen() {
  const { profile, unlock } = useAuth()

  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [lockUntil, setLockUntil] = useState(0)
  const [now, setNow] = useState(() => Date.now())

  const lockedOut = lockUntil > now
  const remaining = Math.max(0, Math.ceil((lockUntil - now) / 1000))

  useEffect(() => {
    if (!lockedOut) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [lockedOut, lockUntil])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (lockedOut) return

    const ok = await unlock(pin)
    if (ok) return

    setPin('')
    const next = attempts + 1
    setAttempts(next)
    setError(
      next >= MAX_ATTEMPTS
        ? 'Too many attempts. Try again in a few moments.'
        : 'Incorrect PIN. Please try again.',
    )
    if (next >= MAX_ATTEMPTS) {
      setLockUntil(Date.now() + LOCKOUT_MS)
      setAttempts(0)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/25">
            <Wallet className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">
            Welcome back, {profile?.name || 'Finora'}
          </h1>
          <p className="mt-2 text-sm text-ink-muted">Enter your PIN to open Finora.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <PinField
            label="Enter your PIN"
            value={pin}
            onChange={setPin}
            error={error}
            autoFocus
          />
          <Button type="submit" size="lg" fullWidth disabled={lockedOut}>
            {lockedOut ? `Try again in ${remaining}s` : 'Unlock Finora'}
          </Button>
        </form>
      </div>
    </div>
  )
}