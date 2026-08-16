import { useState, type FormEvent } from 'react'
import { Wallet } from 'lucide-react'
import { useAuth } from './AuthContext'
import { PinField } from './PinField'
import { isValidPin, hasExistingData } from '../services/profile'
import { storageService } from '../services/storage'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

/** First launch: create a local profile with a name and a 4–6 digit PIN. */
export function OnboardingScreen() {
  const { createProfile } = useAuth()

  const [name, setName] = useState(() => storageService.load().settings.name)
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{ name?: string; pin?: string; confirm?: string }>({})

  const hasExisting = hasExistingData()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (!name.trim()) next.name = 'Enter your name to get started.'
    if (!isValidPin(pin)) next.pin = 'Your PIN must be 4–6 digits.'
    if (pin !== confirm) next.confirm = 'PINs do not match.'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    await createProfile(name.trim(), pin)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/25">
            <Wallet className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">Welcome to Finora</h1>
          <p className="mt-2 text-sm text-ink-muted">Your personal finances, private by default.</p>
        </div>

        {hasExisting && (
          <div className="mb-6 rounded-xl border border-info/25 bg-info-soft/60 px-4 py-3 text-sm text-info">
            We found existing Finora data on this device. Create your local profile to
            continue — your data is preserved.
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            label="Your name"
            placeholder="e.g. Nayra"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            autoFocus
          />

          <PinField
            label="Create your PIN"
            value={pin}
            onChange={setPin}
            error={errors.pin}
            placeholder="• • • • • •"
          />
          <PinField
            label="Confirm your PIN"
            value={confirm}
            onChange={setConfirm}
            error={errors.confirm}
            placeholder="• • • • • •"
          />

          <p className="text-xs text-ink-muted">Use a 4–6 digit PIN to unlock Finora on this device.</p>

          <Button type="submit" size="lg" fullWidth>
            Create profile
          </Button>
        </form>
      </div>
    </div>
  )
}