import { useState, type ReactNode } from 'react'
import { UnlockScreen } from './UnlockScreen'

/** Locks the whole app behind the static site secret until it is entered. */
export function AuthGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false)

  if (!unlocked) return <UnlockScreen onUnlock={() => setUnlocked(true)} />
  return <>{children}</>
}