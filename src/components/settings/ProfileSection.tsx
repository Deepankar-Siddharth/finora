import { useEffect, useState } from 'react'
import { UserRound, Save } from 'lucide-react'
import { useFinance } from '../../context/FinanceContext'
import { useToast } from '../../context/ToastContext'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { CURRENCIES } from '../../constants'

export function ProfileSection() {
  const { settings, updateSettings } = useFinance()
  const { toast } = useToast()

  const [name, setName] = useState(settings.name)
  const [currency, setCurrency] = useState(settings.currency)
  const [target, setTarget] = useState(String(settings.monthlyIncomeTarget))
  const [errors, setErrors] = useState<{ name?: string; target?: string }>({})

  useEffect(() => {
    setName(settings.name)
    setCurrency(settings.currency)
    setTarget(String(settings.monthlyIncomeTarget))
  }, [settings.name, settings.currency, settings.monthlyIncomeTarget])

  function handleSave() {
    const next: { name?: string; target?: string } = {}
    if (!name.trim()) next.name = 'Name cannot be empty.'
    const targetNum = Number(target)
    if (!Number.isFinite(targetNum) || targetNum < 0) next.target = 'Enter a valid target.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    updateSettings({
      name: name.trim(),
      currency,
      monthlyIncomeTarget: targetNum,
    })
    toast('Profile updated.')
  }

  return (
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
  )
}
