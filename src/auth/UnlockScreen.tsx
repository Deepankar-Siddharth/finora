import { useEffect, useState, type FormEvent } from 'react'
import { Wallet } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { PinField } from './PinField'

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 30_000

/** Lock screen: verify the PIN before entering the app. */
export function UnlockScreen() {
  const { verifyPin, cryptoAvailable } = useAuth()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [lockUntil, setLockUntil] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const [busy, setBusy] = useState(false)

  const lockedOut = lockUntil > now
  const remaining = Math.max(0, Math.ceil((lockUntil - now) / 1000))

  useEffect(() => {
    if (!lockedOut) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [lockedOut, lockUntil])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (lockedOut || busy) return
    setBusy(true)
    let ok: boolean
    try {
      ok = await verifyPin(pin)
    } catch {
      setBusy(false)
      setPin('')
      setError('Something went wrong. Please try again.')
      return
    }
    setBusy(false)
    if (!ok) {
      const next = attempts + 1
      setAttempts(next)
      setPin('')
      if (next >= MAX_ATTEMPTS) {
        setError('Too many attempts.')
        setLockUntil(Date.now() + LOCKOUT_MS)
        setAttempts(0)
      } else {
        const left = MAX_ATTEMPTS - next
        setError(`Incorrect PIN. ${left} attempt${left === 1 ? '' : 's'} left.`)
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/25">
            <Wallet className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">Welcome back</h1>
          <p className="mt-2 text-sm text-ink-muted">Enter your PIN to unlock Finora.</p>
        </div>

        {cryptoAvailable ? (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <PinField label="PIN" value={pin} onChange={setPin} error={error} autoFocus />
            <Button
              type="submit"
              size="lg"
              fullWidth
              disabled={lockedOut || busy}
              className="mt-2"
            >
              {lockedOut ? `Try again in ${remaining}s` : busy ? 'Checking…' : 'Unlock'}
            </Button>
          </form>
        ) : (
          <p className="rounded-xl border border-border bg-surface px-4 py-3 text-center text-sm text-ink-muted">
            A secure connection (HTTPS or localhost) is required to verify your PIN.
          </p>
        )}
      </div>
    </div>
  )
}
