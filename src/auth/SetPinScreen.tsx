import { useState, type FormEvent } from 'react'
import { Wallet } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { PinField } from './PinField'
import { isValidPin } from '../utils/pin'

/** First-run screen: create a PIN before entering the app. */
export function SetPinScreen() {
  const { setPin, skipSetup, cryptoAvailable } = useAuth()
  const [pin, setPinValue] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValidPin(pin)) {
      setError('PIN must be 4–6 digits.')
      return
    }
    if (pin !== confirm) {
      setError('PINs do not match.')
      return
    }
    setError('')
    setBusy(true)
    try {
      await setPin(pin)
    } catch {
      setBusy(false)
      setError('Could not save your PIN on this device. Check your browser settings and try again.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/25">
            <Wallet className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">Welcome to Finora</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Create a 4–6 digit PIN to keep your finances private on this device.
          </p>
        </div>

        {cryptoAvailable ? (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <PinField label="Create PIN" value={pin} onChange={setPinValue} autoFocus />
            <PinField label="Confirm PIN" value={confirm} onChange={setConfirm} />
            {error && <p className="text-center text-sm text-danger">{error}</p>}
            <Button type="submit" size="lg" fullWidth disabled={busy} className="mt-2">
              {busy ? 'Setting up…' : 'Set PIN'}
            </Button>
          </form>
        ) : (
          <div className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-center text-sm text-danger">
            A secure connection (HTTPS or localhost) is required to create a PIN.
          </div>
        )}

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={skipSetup}
            className="text-sm font-medium text-ink-muted transition-colors hover:text-ink"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}
