import { createContext, useContext } from 'react'
import type { ProfileData, PinChangeResult } from '../services/profile'

export type AuthStatus = 'onboarding' | 'locked' | 'unlocked'

export interface AuthContextValue {
  status: AuthStatus
  profile: ProfileData | null
  createProfile: (name: string, pin: string) => Promise<void>
  unlock: (pin: string) => Promise<boolean>
  lock: () => void
  changeName: (name: string) => void
  changePin: (current: string, next: string) => Promise<PinChangeResult>
  deleteAllLocalData: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}