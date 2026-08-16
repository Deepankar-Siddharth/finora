import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { OnboardingScreen } from './OnboardingScreen'
import { LoginScreen } from './LoginScreen'

/** Renders onboarding, the PIN login, or the app depending on auth state. */
export function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useAuth()

  if (status === 'onboarding') return <OnboardingScreen />
  if (status === 'locked') return <LoginScreen />
  return <>{children}</>
}