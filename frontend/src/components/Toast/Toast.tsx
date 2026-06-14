import { useState, useRef } from 'react'
import './Toast.css'

export interface ToastItem {
  id: number
  ok: boolean
  text: string
  leaving: boolean
}

export function useToast() {
  const idRef = useRef(0)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  function showToast(ok: boolean, text: string) {
    const id = ++idRef.current
    setToasts(prev => [...prev, { id, ok, text, leaving: false }])
    setTimeout(() => setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t)), 3000)
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3400)
  }

  return { toasts, showToast }
}

export default function ToastContainer({ toasts }: { toasts: ToastItem[] }) {
  if (!toasts.length) return null
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast${t.ok ? ' toast--ok' : ' toast--err'}${t.leaving ? ' toast--leaving' : ''}`}
        >
          {t.text}
        </div>
      ))}
    </div>
  )
}
