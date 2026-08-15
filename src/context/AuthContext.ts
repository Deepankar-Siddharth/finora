import { createContext, useContext } from 'react'

export type AuthStatus = 'setup' | 'locked' | 'unlocked'

export interface AuthContextValue {
  status: AuthStatus
  /** Whether a PIN is currently configured. */
  pinEnabled: boolean
  /** Web Crypto is unavailable in non-secure contexts; screens handle this. */
  cryptoAvailable: boolean
  /** Create the PIN and unlock (first-run setup). */
  setPin: (pin: string) => Promise<void>
  /** Check the PIN; unlocks the app when correct. */
  verifyPin: (pin: string) => Promise<boolean>
  /** Change the PIN after verifying the current one. */
  updatePin: (current: string, next: string) => Promise<boolean>
  /** Remove protection after verifying the current PIN. */
  removePin: (current: string) => Promise<boolean>
  /** Skip first-run setup and stay unprotected. */
  skipSetup: () => void
  /** Lock the app immediately. */
  lock: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
