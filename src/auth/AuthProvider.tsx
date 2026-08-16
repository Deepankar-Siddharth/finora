import { useCallback, useMemo, useState, type ReactNode } from 'react'
import type { ProfileData } from '../services/profile'
import {
  changePin as changePinService,
  createProfile as createProfileService,
  deleteAllLocalData as deleteAllService,
  hasProfile,
  loadProfile,
  updateProfileName,
  verifyPin,
} from '../services/profile'
import { AuthContext, type AuthContextValue, type AuthStatus } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileData | null>(() => loadProfile())
  const [status, setStatus] = useState<AuthStatus>(() => (hasProfile() ? 'locked' : 'onboarding'))

  const createProfile = useCallback(async (name: string, pin: string) => {
    const created = await createProfileService(name, pin)
    setProfile(created)
    setStatus('unlocked')
  }, [])

  const unlock = useCallback(async (pin: string) => {
    const ok = await verifyPin(pin)
    if (ok) setStatus('unlocked')
    return ok
  }, [])

  const lock = useCallback(() => {
    setStatus('locked')
  }, [])

  const changeName = useCallback((name: string) => {
    setProfile((current) => updateProfileName(name) ?? current)
  }, [])

  const changePin = useCallback(async (current: string, next: string) => {
    const result = await changePinService(current, next)
    if (result === 'ok') {
      setProfile(loadProfile())
    }
    return result
  }, [])

  const deleteAllLocalData = useCallback(() => {
    deleteAllService()
    setProfile(null)
    setStatus('onboarding')
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      profile,
      createProfile,
      unlock,
      lock,
      changeName,
      changePin,
      deleteAllLocalData,
    }),
    [status, profile, createProfile, unlock, lock, changeName, changePin, deleteAllLocalData],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}