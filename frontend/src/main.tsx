import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Apply saved theme before first paint to avoid flash
document.documentElement.dataset.theme = localStorage.getItem('theme') || 'light'
import { BrowserRouter } from 'react-router-dom'
import { LangProvider } from './i18n/LangContext'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LangProvider>
        <App />
      </LangProvider>
    </BrowserRouter>
  </StrictMode>,
)
