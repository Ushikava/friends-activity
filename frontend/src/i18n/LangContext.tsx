import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { ru, en } from './translations'
import type { TranslationValue, Dict } from './translations'

type Lang = 'ru' | 'en'

export type { Lang }

interface LangContextValue {
  lang: Lang
  setLanguage: (lang: Lang) => void
  t: (key: string) => string
  tRaw: (key: string) => TranslationValue
}

const dicts: Record<Lang, Dict> = { ru, en }

const LangContext = createContext<LangContextValue | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(
    () => (localStorage.getItem('lang') as Lang) || 'ru'
  )

  function setLanguage(newLang: Lang): void {
    localStorage.setItem('lang', newLang)
    setLang(newLang)
  }

  function tRaw(key: string): TranslationValue {
    return dicts[lang][key] ?? dicts.ru[key] ?? key
  }

  function t(key: string): string {
    const val = tRaw(key)
    return typeof val === 'string' ? val : key
  }

  return (
    <LangContext.Provider value={{ lang, setLanguage, t, tRaw }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used inside LangProvider')
  return ctx
}
