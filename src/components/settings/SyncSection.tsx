import { useState } from 'react'
import { CloudUpload, RefreshCw } from 'lucide-react'
import { useFinance } from '../../context/FinanceContext'
import { useToast } from '../../context/ToastContext'
import { describeSyncError } from '../../services/sync'
import { SYNC_STATUS_META } from '../../constants'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'

function formatWhen(iso: string | undefined): string {
  if (!iso) return 'Never'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return 'Never'
  }
}

export function SyncSection() {
  const {
    syncStatus,
    lastSyncedAt,
    syncError,
    connectSync,
    disconnectSync,
    syncNow,
  } = useFinance()
  const { toast } = useToast()

  const [token, setToken] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [busy, setBusy] = useState(false)
  const [connectError, setConnectError] = useState<string>()

  const connected = syncStatus !== 'disabled'
  const status = SYNC_STATUS_META[syncStatus]

  async function handleConnect() {
    setBusy(true)
    setConnectError(undefined)
    try {
      await connectSync(token, passphrase)
      setToken('')
      setPassphrase('')
      toast('Sync connected.')
    } catch (err) {
      setConnectError(describeSyncError(err).message)
    } finally {
      setBusy(false)
    }
  }

  function handleDisconnect() {
    disconnectSync()
    toast('Sync disconnected. Your local data is untouched.')
  }

  return (
    <Card>
      <div className="mb-5 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
          <CloudUpload className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-ink">Sync</h2>
          <p className="text-sm text-ink-muted">
            Keep your data in sync across devices using your GitHub repository.
          </p>
        </div>
      </div>

      {!connected ? (
        <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="GitHub Personal Access Token"
            type="password"
            autoComplete="off"
            placeholder="Enter your GitHub token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            error={connectError ? ' ' : undefined}
          />
          <Input
            label="Encryption Passphrase"
            type="password"
            autoComplete="off"
            placeholder="Secret used to encrypt your data"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
          />
          {connectError && (
            <p className="text-xs text-danger sm:col-span-2">{connectError}</p>
          )}
          <div className="flex items-end sm:col-span-2">
            <Button onClick={handleConnect} disabled={busy} icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}>
              {busy ? 'Connecting…' : 'Connect'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone={status.tone}>{status.label}</Badge>
            <span className="text-xs text-ink-muted">
              Last synced: <span className="font-medium tabular-nums text-ink-soft">{formatWhen(lastSyncedAt)}</span>
            </span>
          </div>

          {syncError && (
            <div role="status" className="rounded-xl border border-warning/25 bg-warning-soft/60 px-4 py-3 text-sm text-warning">
              {syncError}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={syncNow}
              disabled={syncStatus === 'syncing'}
              icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
            >
              {syncStatus === 'syncing' ? 'Syncing…' : 'Sync now'}
            </Button>
            <Button variant="outline" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}