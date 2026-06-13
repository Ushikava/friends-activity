import { useState, useEffect } from 'react'
import ConfirmModal from '../ConfirmModal/ConfirmModal'
import { useLang } from '../../i18n/LangContext'
import './Lightbox.css'

interface LightboxProps {
  src: string
  description?: string
  createdAt?: string
  onClose: () => void
  onDelete?: () => void
}

export default function Lightbox({ src, description, createdAt, onClose, onDelete }: LightboxProps) {
  const { t, lang } = useLang()
  const [closing, setClosing] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  function close() { setClosing(true) }

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const dateStr = createdAt
    ? new Date(createdAt).toLocaleDateString(
        lang === 'ru' ? 'ru-RU' : 'en-US',
        { day: 'numeric', month: 'long', year: 'numeric' }
      )
    : ''

  return (
    <div
      className={`lightbox${closing ? ' lightbox--closing' : ''}`}
      onClick={e => { if (e.target === e.currentTarget) close() }}
      onAnimationEnd={e => { if (e.animationName === 'lightbox-out') onClose() }}
    >
      <div className="lightbox__inner" onClick={close}>
        <button className="lightbox__close" onClick={close}>×</button>
        <img src={src} alt={description || ''} className="lightbox__img" />
        <div className="lightbox__footer">
          <p className="lightbox__desc">{description || ''}</p>
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
