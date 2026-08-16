import { useEffect, useState } from 'react'
import { KeyRound, Lock, Save, ShieldCheck, UserRound } from 'lucide-react'
import { useFinance } from '../../context/FinanceContext'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../auth/AuthContext'
import { isValidPin } from '../../services/profile'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Modal } from '../ui/Modal'
import { PinField } from '../../auth/PinField'
import { CURRENCIES } from '../../constants'

export function ProfileSection() {
  const { settings, updateSettings } = useFinance()
  const { profile, changeName, changePin, lock } = useAuth()
  const { toast } = useToast()

  const [name, setName] = useState(profile?.name ?? settings.name)
  const [currency, setCurrency] = useState(settings.currency)
  const [target, setTarget] = useState(String(settings.monthlyIncomeTarget))
  const [errors, setErrors] = useState<{ name?: string; target?: string }>({})

  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [currentError, setCurrentError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setName(profile?.name ?? settings.name)
    setCurrency(settings.currency)
    setTarget(String(settings.monthlyIncomeTarget))
  }, [profile?.name, settings.name, settings.currency, settings.monthlyIncomeTarget])

  function handleSave() {
    const next: { name?: string; target?: string } = {}
    if (!name.trim()) next.name = 'Name cannot be empty.'
    const targetNum = Number(target)
    if (!Number.isFinite(targetNum) || targetNum < 0) next.target = 'Enter a valid target.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    changeName(name.trim())
    updateSettings({
      currency,
      monthlyIncomeTarget: targetNum,
    })
    toast('Profile updated.')
  }

  function openChangePin() {
    setCurrentPin('')
    setNewPin('')
    setConfirmPin('')
    setPinError('')
    setCurrentError('')
    setPinModalOpen(true)
  }

  async function handleChangePin() {
    setPinError('')
    setCurrentError('')
    if (!isValidPin(newPin)) {
      setPinError('Your new PIN must be 4–6 digits.')
      return
    }
    if (newPin !== confirmPin) {
      setPinError('New PINs do not match.')
      return
    }
    if (newPin === currentPin) {
      setPinError('Your new PIN must be different from your current PIN.')
      return
    }
    setBusy(true)
    try {
      const result = await changePin(currentPin, newPin)
      if (result === 'wrong-current') {
        setCurrentError('Your current PIN is incorrect.')
        return
      }
      if (result === 'invalid') {
        setPinError('Your new PIN must be 4–6 digits.')
        return
      }
      setPinModalOpen(false)
      toast('PIN updated.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Card>
        <div className="mb-5 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
            <UserRound className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-ink">Profile</h2>
            <p className="text-sm text-ink-muted">How Finora greets you and presents amounts.</p>
          </div>
        </div>

        <form
          className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            handleSave()
          }}
          noValidate
        >
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
          <Select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.code} — {c.label}
              </option>
            ))}
          </Select>
          <Input
            label="Monthly Income Target"
            type="number"
            inputMode="decimal"
            min="0"
            placeholder="0.00"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            error={errors.target}
            icon={<span className="text-sm font-medium text-ink-muted">₹</span>}
          />
          <div className="flex items-end">
            <Button type="submit" icon={<Save className="h-4 w-4" aria-hidden="true" />}>
              Save Profile
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <div className="mb-5 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
            <ShieldCheck className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-ink">Security</h2>
            <p className="text-sm text-ink-muted">
              Sign in locally with your PIN. Finora data never leaves this device.
            </p>
          </div>
        </div>

        <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={openChangePin}
            className="flex items-center gap-3 rounded-xl border border-border p-4 text-left transition-colors hover:border-border-strong hover:bg-surface-2/50"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink-soft">
              <KeyRound className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-ink">Change PIN</span>
              <span className="block text-xs text-ink-muted">Pick a new 4–6 digit PIN</span>
            </span>
          </button>

          <button
            type="button"
            onClick={lock}
            className="flex items-center gap-3 rounded-xl border border-border p-4 text-left transition-colors hover:border-border-strong hover:bg-surface-2/50"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink-soft">
              <Lock className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-ink">Lock Finora</span>
              <span className="block text-xs text-ink-muted">Require your PIN to get back in</span>
            </span>
          </button>
        </div>
      </Card>

      <Modal
        open={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        title="Change your PIN"
        description="Confirm your current PIN, then set a new one."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPinModalOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={handleChangePin} disabled={busy}>
              {busy ? 'Updating…' : 'Update PIN'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <PinField
            label="Current PIN"
            value={currentPin}
            onChange={setCurrentPin}
            error={currentError}
          />
          <PinField label="New PIN" value={newPin} onChange={setNewPin} />
          <PinField label="Confirm new PIN" value={confirmPin} onChange={setConfirmPin} error={pinError} />
        </div>
      </Modal>
    </>
  )
}