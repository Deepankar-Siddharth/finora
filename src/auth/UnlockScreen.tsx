import { useEffect, useState, type FormEvent } from 'react'
import { Wallet } from 'lucide-react'
import { SITE_SECRET } from '../site.config'
import { Button } from '../components/ui/Button'
import { PinField } from './PinField'

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 30_000

/** Entry gate: a static secret number shown on every visit opens Finora. */
export function UnlockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [secret, setSecret] = useState('')
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

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (lockedOut) return
    if (secret === SITE_SECRET) {
      onUnlock()
      return
    }
    const next = attempts + 1
    setAttempts(next)
    setSecret('')
    if (next >= MAX_ATTEMPTS) {
      setError('Too many attempts.')
      setLockUntil(Date.now() + LOCKOUT_MS)
      setAttempts(0)
    } else {
      const left = MAX_ATTEMPTS - next
      setError(`Incorrect secret. ${left} attempt${left === 1 ? '' : 's'} left.`)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/25">
            <Wallet className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">Finora</h1>
          <p className="mt-2 text-sm text-ink-muted">Enter the secret number to open Finora.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <PinField label="Secret number" value={secret} onChange={setSecret} error={error} autoFocus />
          <Button type="submit" size="lg" fullWidth disabled={lockedOut} className="mt-2">
            {lockedOut ? `Try again in ${remaining}s` : 'Open Finora'}
          </Button>
        </form>
      </div>
    </div>
  )
}