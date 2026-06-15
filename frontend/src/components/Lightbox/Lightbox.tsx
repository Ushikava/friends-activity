import { useState, useEffect, useRef } from 'react'
import ConfirmModal from '../ConfirmModal/ConfirmModal'
import { useLang } from '../../i18n/LangContext'
import './Lightbox.css'

interface LightboxProps {
  src: string
  description?: string
  createdAt?: string
  onClose: () => void
  onDelete?: () => void
  onSaveDescription?: (desc: string | null) => Promise<void>
}

export default function Lightbox({ src, description, createdAt, onClose, onDelete, onSaveDescription }: LightboxProps) {
  const { t, lang } = useLang()
  const [closing, setClosing] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(description ?? '')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function close() { setClosing(true) }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isEditing) close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isEditing])

  const dateStr = createdAt
    ? new Date(createdAt).toLocaleDateString(
        lang === 'ru' ? 'ru-RU' : 'en-US',
        { day: 'numeric', month: 'long', year: 'numeric' }
      )
    : ''

  function startEdit(e: React.MouseEvent) {
    e.stopPropagation()
    setEditValue(description ?? '')
    setIsEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  async function commitEdit() {
    if (saving) return
    const next = editValue.trim() || null
    if (next === (description ?? null)) { setIsEditing(false); return }
    setSaving(true)
    try {
      await onSaveDescription?.(next)
    } finally {
      setSaving(false)
      setIsEditing(false)
    }
  }

  function cancelEdit(e: React.KeyboardEvent) {
    e.preventDefault()
    setIsEditing(false)
    setEditValue(description ?? '')
  }

  return (
    <div
      className={`lightbox${closing ? ' lightbox--closing' : ''}`}
      onClick={e => { if (e.target === e.currentTarget) close() }}
      onAnimationEnd={e => { if (e.animationName === 'lightbox-out') onClose() }}
    >
      <div className="lightbox__inner" onClick={isEditing ? undefined : close}>
        <button className="lightbox__close" onClick={close}>×</button>
        <img src={src} alt={description || ''} className="lightbox__img" />

        <div className="lightbox__footer">
          <div
            className={`lightbox__desc-wrap${onSaveDescription ? ' lightbox__desc-wrap--editable' : ''}`}
            onClick={e => e.stopPropagation()}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                className="lightbox__desc-input"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitEdit()
                  if (e.key === 'Escape') cancelEdit(e)
                }}
                onBlur={commitEdit}
                placeholder="Описание..."
                disabled={saving}
              />
            ) : (
              <>
                <p className="lightbox__desc">{description || ''}</p>
                {onSaveDescription && (
                  <button className="lightbox__edit-btn" onClick={startEdit} title="Редактировать описание">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                )}
              </>
            )}
          </div>
          {dateStr && <span className="lightbox__date">{dateStr}</span>}
        </div>

        {onDelete && (
          <button
            className="lightbox__delete"
            onClick={e => { e.stopPropagation(); setConfirmOpen(true) }}
          >{t('common.delete')}</button>
        )}
        {confirmOpen && (
          <ConfirmModal
            onConfirm={() => { setConfirmOpen(false); onDelete?.(); onClose() }}
            onCancel={() => setConfirmOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
