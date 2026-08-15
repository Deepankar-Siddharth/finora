import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import { SetPinScreen } from './SetPinScreen'
import { UnlockScreen } from './UnlockScreen'

/** Gates the whole app behind the PIN lock. */
export function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useAuth()

  if (status === 'setup') return <SetPinScreen />
  if (status === 'locked') return <UnlockScreen />
  return <>{children}</>
}
