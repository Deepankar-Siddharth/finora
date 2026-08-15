import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { AuthContext, type AuthStatus } from './AuthContext'
import { storageService } from '../services/storage'
import { generateSalt, hashPin, isCryptoAvailable } from '../utils/pin'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(() => {
    const auth = storageService.loadAuth()
    if (auth === null) return 'setup' // Never configured yet — first-run screen.
    return auth.enabled ? 'locked' : 'unlocked'
  })
  const [pinEnabled, setPinEnabled] = useState<boolean>(() => {
    const auth = storageService.loadAuth()
    return auth?.enabled === true
  })
  const [cryptoAvailable] = useState(isCryptoAvailable)

  const setPin = useCallback(async (pin: string) => {
    const salt = generateSalt()
    const hash = await hashPin(pin, salt)
    storageService.saveAuth({ enabled: true, salt, hash })
    setPinEnabled(true)
    setStatus('unlocked')
  }, [])

  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    const auth = storageService.loadAuth()
    if (!auth?.enabled || !auth.salt || !auth.hash) return false
    const hash = await hashPin(pin, auth.salt)
    if (hash === auth.hash) {
      setStatus('unlocked')
      return true
    }
    return false
  }, [])

  const updatePin = useCallback(
    async (current: string, next: string): Promise<boolean> => {
      if (!(await verifyPin(current))) return false
      await setPin(next)
      return true
    },
    [verifyPin, setPin],
  )

  const removePin = useCallback(
    async (current: string): Promise<boolean> => {
      const auth = storageService.loadAuth()
      if (auth?.enabled && !(await verifyPin(current))) return false
      storageService.saveAuth({ enabled: false })
      setPinEnabled(false)
      setStatus('unlocked')
      return true
    },
    [verifyPin],
  )

  const skipSetup = useCallback(() => {
    storageService.saveAuth({ enabled: false })
    setPinEnabled(false)
    setStatus('unlocked')
  }, [])

  const lock = useCallback(() => setStatus('locked'), [])

  const value = useMemo(
    () => ({
      status,
      pinEnabled,
      cryptoAvailable,
      setPin,
      verifyPin,
      updatePin,
      removePin,
      skipSetup,
      lock,
    }),
    [status, pinEnabled, cryptoAvailable, setPin, verifyPin, updatePin, removePin, skipSetup, lock],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
