import { useState, useEffect } from 'react'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import { useLang } from '../../i18n/LangContext'
import './FloatingWidget.css'

export default function FloatingWidget() {
  const { lang, setLanguage } = useLang()
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || localStorage.getItem('theme') || 'light'
  )

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.dataset.theme || 'light')
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    document.documentElement.dataset.theme = next
    localStorage.setItem('theme', next)
    setTheme(next)
  }

  return (
    <div className="fw">
      <button className="fw__theme" onClick={toggleTheme} title={theme === 'light' ? 'Dark mode' : 'Light mode'}>
        {theme === 'light' ? <MoonIcon className="fw__icon" /> : <SunIcon className="fw__icon" />}
      </button>
      <div className="fw__sep" />
      <button className={`fw__lang${lang === 'ru' ? ' fw__lang--on' : ''}`} onClick={() => setLanguage('ru')}>RU</button>
      <button className={`fw__lang${lang === 'en' ? ' fw__lang--on' : ''}`} onClick={() => setLanguage('en')}>EN</button>
      <div className="fw__sep" />
      <span className="fw__author_by">made by:</span>
      <a
        className="fw__author"
        href="https://github.com/Ushikava"
        target="_blank"
        rel="noopener noreferrer"
      >
        Ushikava
      </a>
    </div>
  )
}
