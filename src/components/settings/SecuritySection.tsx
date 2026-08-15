import { useState, type FormEvent } from 'react'
import { ShieldCheck, KeyRound, Lock, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { PinField } from '../../auth/PinField'
import { isValidPin } from '../../utils/pin'

type Mode = 'enable' | 'change' | 'remove' | null

const MODAL_META: Record<Exclude<Mode, null>, { title: string; description: string }> = {
  enable: {
    title: 'Enable PIN',
    description: 'Create a 4–6 digit PIN to protect Finora on this device.',
  },
  change: {
    title: 'Change PIN',
    description: 'Enter your current PIN, then choose a new one.',
  },
  remove: {
    title: 'Remove PIN',
    description: 'Enter your current PIN to disable protection.',
  },
}

export function SecuritySection() {
  const { pinEnabled, setPin, updatePin, removePin, lock } = useAuth()
  const { toast } = useToast()

  const [mode, setMode] = useState<Mode>(null)
  const [current, setCurrent] = useState('')
  const [pin, setPinValue] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function open(next: Exclude<Mode, null>) {
    setMode(next)
    setCurrent('')
    setPinValue('')
    setConfirm('')
    setError('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (mode === 'enable' || mode === 'change') {
      if (!isValidPin(pin)) {
        setError('PIN must be 4–6 digits.')
        return
      }
      if (pin !== confirm) {
        setError('PINs do not match.')
        return
      }
    }
    setBusy(true)
    try {
      if (mode === 'enable') {
        await setPin(pin)
        toast('PIN protection enabled.')
      } else if (mode === 'change') {
        const ok = await updatePin(current, pin)
        if (!ok) {
          setError('Current PIN is incorrect.')
          return
        }
        toast('PIN changed.')
      } else if (mode === 'remove') {
        const ok = await removePin(current)
        if (!ok) {
          setError('Current PIN is incorrect.')
          return
        }
        toast('PIN protection removed.')
      }
      setMode(null)
    } finally {
      setBusy(false)
    }
  }

  const meta = mode ? MODAL_META[mode] : null

  return (
    <Card>
      <div className="mb-5 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
          <ShieldCheck className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-ink">Security</h2>
          <p className="text-sm text-ink-muted">Protect Finora with a personal PIN.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-ink">
            {pinEnabled ? 'PIN protection is on' : 'PIN protection is off'}
          </p>
          <p className="mt-0.5 text-xs text-ink-muted">
            {pinEnabled
              ? 'You will be asked for your PIN each time you open Finora.'
              : 'No PIN is set for this device.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {pinEnabled ? (
            <>
              <Button variant="secondary" icon={<KeyRound className="h-4 w-4" aria-hidden="true" />} onClick={() => open('change')}>
                Change PIN
              </Button>
              <Button variant="secondary" icon={<Lock className="h-4 w-4" aria-hidden="true" />} onClick={lock}>
                Lock now
              </Button>
              <Button variant="danger" icon={<Trash2 className="h-4 w-4" aria-hidden="true" />} onClick={() => open('remove')}>
                Remove PIN
              </Button>
            </>
          ) : (
            <Button variant="secondary" icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => open('enable')}>
              Enable PIN
            </Button>
          )}
        </div>
      </div>

      <Modal
        open={mode !== null}
        onClose={() => setMode(null)}
        title={meta?.title ?? ''}
        description={meta?.description}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setMode(null)}>
              Cancel
            </Button>
            <Button type="submit" form="security-form" disabled={busy}>
              {busy ? 'Working…' : mode === 'remove' ? 'Remove PIN' : mode === 'change' ? 'Change PIN' : 'Enable PIN'}
            </Button>
          </>
        }
      >
        <form id="security-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          {mode === 'change' && (
            <PinField label="Current PIN" value={current} onChange={setCurrent} autoFocus />
          )}
          {(mode === 'enable' || mode === 'change') && (
            <>
              <PinField
                label={mode === 'change' ? 'New PIN' : 'Create PIN'}
                value={pin}
                onChange={setPinValue}
                autoFocus={mode !== 'change'}
              />
              <PinField label="Confirm PIN" value={confirm} onChange={setConfirm} />
            </>
          )}
          {mode === 'remove' && (
            <PinField label="Enter your current PIN" value={current} onChange={setCurrent} autoFocus />
          )}
          {error && <p className="text-sm text-danger">{error}</p>}
        </form>
      </Modal>
    </Card>
  )
}
