import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { getUsername, NYA_COINS_AWARDED_EVENT, NYA_AUTH_CHANGED_EVENT } from '../api/auth'
import type { NyaCoinsAwardedDetail } from '../api/auth'
import { fetchCoinBalance } from '../api/coins'
import { useLang } from '../i18n/LangContext'
import ToastContainer, { useToast } from '../components/Toast/Toast'

interface CoinsContextValue {
  balance: number
  refresh: () => void
  setBalance: (balance: number) => void
}

const CoinsContext = createContext<CoinsContextValue | null>(null)

export function CoinsProvider({ children }: { children: ReactNode }) {
  const { t } = useLang()
  const [balance, setBalance] = useState(0)
  const { toasts, showToast } = useToast()

  const refresh = useCallback(() => {
    if (!getUsername()) {
      setBalance(0)
      return
    }
    fetchCoinBalance().then(b => setBalance(b.balance)).catch(() => {})
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener(NYA_AUTH_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(NYA_AUTH_CHANGED_EVENT, refresh)
  }, [refresh])

  useEffect(() => {
    function onAwarded(e: Event) {
      const amount = (e as CustomEvent<NyaCoinsAwardedDetail>).detail?.amount ?? 0
      if (amount <= 0) return
      setBalance(b => b + amount)
      showToast(true, `+${amount} 🪙 ${t('coins.title')}`)
    }
    window.addEventListener(NYA_COINS_AWARDED_EVENT, onAwarded)
    return () => window.removeEventListener(NYA_COINS_AWARDED_EVENT, onAwarded)
  }, [t, showToast])

  return (
    <CoinsContext.Provider value={{ balance, refresh, setBalance }}>
      {children}
      <ToastContainer toasts={toasts} />
    </CoinsContext.Provider>
  )
}

export function useCoins(): CoinsContextValue {
  const ctx = useContext(CoinsContext)
  if (!ctx) throw new Error('useCoins must be used within CoinsProvider')
  return ctx
}
