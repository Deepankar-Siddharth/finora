import { useCallback, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, Info, X } from 'lucide-react'
import { ToastContext, type ToastTone } from '../../context/ToastContext'

interface Toast {
  id: string
  message: string
  tone: ToastTone
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const toast = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      setToasts((list) => [...list.slice(-2), { id, message, tone }])
      const timer = setTimeout(() => dismiss(id), 4500)
      timers.current.set(id, timer)
    },
    [dismiss],
  )

  const tones: Record<ToastTone, string> = {
    success: 'text-success',
    info: 'text-info',
    danger: 'text-danger',
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 sm:left-auto sm:right-4 sm:translate-x-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 shadow-pop"
          >
            {t.tone === 'success' ? (
              <CheckCircle2 className={`h-4.5 w-4.5 shrink-0 ${tones[t.tone]}`} aria-hidden="true" />
            ) : (
              <Info className={`h-4.5 w-4.5 shrink-0 ${tones[t.tone]}`} aria-hidden="true" />
            )}
            <p className="flex-1 text-sm text-ink">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="rounded-md p-1 text-ink-muted transition-colors hover:text-ink"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
