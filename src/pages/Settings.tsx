import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import type { ImportResult } from '../types'
import { useFinance } from '../context/FinanceContext'
import { useAuth } from '../auth/AuthContext'
import { useToast } from '../context/ToastContext'
import { PageHeader } from '../components/ui/PageHeader'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ProfileSection } from '../components/settings/ProfileSection'
import { AppearanceSection } from '../components/settings/AppearanceSection'
import { DataSection } from '../components/settings/DataSection'
import { SyncSection } from '../components/settings/SyncSection'
import { ALL_CATEGORIES } from '../constants/categories'
import { generateCSV, parseCSVToTransactions, summarizeImport } from '../utils/csv'
import { todayISO } from '../utils/dates'

const VALID_CATEGORIES = new Set(ALL_CATEGORIES.map((c) => c.name))

export function Settings() {
  const { transactions, importTransactions } = useFinance()
  const { deleteAllLocalData } = useAuth()
  const { toast } = useToast()

  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [resetConfirmation, setResetConfirmation] = useState('')

  function handleExport() {
    const csv = generateCSV(transactions)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `finora-transactions-${todayISO()}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    toast(transactions.length > 0 ? `Exported ${transactions.length} transactions.` : 'Nothing to export yet.')
  }

  function handleImport(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      const { transactions: parsed, errors } = parseCSVToTransactions(text, VALID_CATEGORIES, transactions)
      const result = summarizeImport(parsed.length + errors.length, parsed, errors)
      if (parsed.length > 0) {
        importTransactions(parsed)
      }
      setImportResult(result)
    }
    reader.onerror = () => {
      toast('Could not read that file. Please try again.', 'danger')
    }
    reader.readAsText(file)
  }

  function handleReset() {
    if (resetConfirmation.trim().toUpperCase() !== 'DELETE') return
    deleteAllLocalData()
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your profile, appearance and data." />

      <ProfileSection />
      <AppearanceSection />
      <DataSection
        onExport={handleExport}
        onImport={handleImport}
        onReset={() => {
          setResetConfirmation('')
          setResetDialogOpen(true)
        }}
        importResult={importResult}
        onCloseReport={() => setImportResult(null)}
      />
      <SyncSection />

      <Modal
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        title="Delete all Finora data?"
        description="This cannot be undone."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={resetConfirmation.trim().toUpperCase() !== 'DELETE'}
              onClick={handleReset}
            >
              Delete everything
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
            <AlertTriangle className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <p className="mb-3 text-sm leading-relaxed text-ink-soft">
              This permanently deletes your transactions, budgets, savings goals, recurring
              schedules, sync connection and your local profile. You will be signed out and Finora
              will start as new on this device.
            </p>
            <Input
              label="Type DELETE to confirm"
              placeholder="DELETE"
              value={resetConfirmation}
              onChange={(e) => setResetConfirmation(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
