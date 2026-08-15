import { AlertTriangle, Download, Upload, Database } from 'lucide-react'
import type { ImportResult } from '../../types'
import { Card } from '../ui/Card'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

interface ImportReportModalProps {
  open: boolean
  result: ImportResult | null
  onClose: () => void
}

export function ImportReportModal({ open, result, onClose }: ImportReportModalProps) {
  if (!result) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import completed"
      description="Here's what happened with your CSV file."
      size="md"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-surface-2 p-3 text-center">
          <p className="text-2xl font-semibold text-ink">{result.total}</p>
          <p className="text-xs text-ink-muted">Rows processed</p>
        </div>
        <div className="rounded-xl border border-success/20 bg-success-soft p-3 text-center">
          <p className="text-2xl font-semibold text-success">{result.imported}</p>
          <p className="text-xs text-success">Imported</p>
        </div>
        <div className="rounded-xl border border-danger/20 bg-danger-soft p-3 text-center">
          <p className="text-2xl font-semibold text-danger">{result.failed}</p>
          <p className="text-xs text-danger">Failed</p>
        </div>
      </div>

      {result.failed > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-medium text-ink">Failed rows</h3>
          <ul className="scrollbar-thin max-h-48 space-y-1.5 overflow-y-auto">
            {result.errors.map((err) => (
              <li
                key={`${err.row}-${err.reason}`}
                className="flex items-start gap-2 rounded-lg bg-danger-soft/70 px-3 py-2 text-xs text-danger"
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>
                  <span className="font-semibold">Row {err.row}:</span> {err.reason}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  )
}

interface DataSectionProps {
  onExport: () => void
  onImport: (file: File) => void
  onReset: () => void
  importResult: ImportResult | null
  onCloseReport: () => void
  disabled?: boolean
}

export function DataSection({ onExport, onImport, onReset, importResult, onCloseReport, disabled }: DataSectionProps) {
  return (
    <Card>
      <div className="mb-5 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
          <Database className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-ink">Data</h2>
          <p className="text-sm text-ink-muted">Export, import or reset your local data.</p>
        </div>
      </div>

      <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-4 transition-colors hover:border-border-strong hover:bg-surface-2/50">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink-soft">
            <Upload className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-medium text-ink">Import CSV</span>
            <span className="block text-xs text-ink-muted">Bring transactions back from a file</span>
          </span>
          <input
            type="file"
            accept=".csv,text/csv"
            disabled={disabled}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onImport(file)
              e.target.value = ''
            }}
            className="sr-only"
          />
        </label>

        <button
          type="button"
          onClick={onExport}
          disabled={disabled}
          className="flex items-center gap-3 rounded-xl border border-border p-4 text-left transition-colors hover:border-border-strong hover:bg-surface-2/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink-soft">
            <Download className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-medium text-ink">Export CSV</span>
            <span className="block text-xs text-ink-muted">Download all transactions</span>
          </span>
        </button>
      </div>

      <div className="mt-6 rounded-xl border border-danger/25 bg-danger-soft/60 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-danger">Reset all data</p>
            <p className="mt-0.5 text-xs text-danger/90">
              Permanently removes every transaction, budget, goal and recurring schedule stored in
              this browser.
            </p>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-danger/40 px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger hover:text-white"
          >
            Reset data
          </button>
        </div>
      </div>

      <ImportReportModal open={importResult !== null} result={importResult} onClose={onCloseReport} />
    </Card>
  )
}
