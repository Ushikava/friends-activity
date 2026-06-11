import { createContext, useContext, useState } from 'react'
import { ru, en } from './translations'

const dicts = { ru, en }

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ru')

  function setLanguage(newLang) {
    localStorage.setItem('lang', newLang)
    setLang(newLang)
  }

  function t(key) {
    return dicts[lang][key] ?? dicts.ru[key] ?? key
  }

  return (
    <LangContext.Provider value={{ lang, setLanguage, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
