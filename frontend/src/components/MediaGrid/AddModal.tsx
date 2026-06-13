import { useState, useRef } from 'react'
import type { FormEvent, ClipboardEvent } from 'react'
import { useLang } from '../../i18n/LangContext'

interface ExtraField {
  name: string
  placeholder: string
}

interface Props {
  title: string
  onClose: () => void
  onSubmit: (name: string, file: File | null, url: null, extras: Record<string, string>) => Promise<void>
  extraFields?: ExtraField[]
}

export default function AddModal({ title, onClose, onSubmit, extraFields = [] }: Props) {
  const { t } = useLang()
  const [closing, setClosing] = useState(false)
  const [name, setName] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [imageSource, setImageSource] = useState<File | null>(null)
  const [extras, setExtras] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function close() { setClosing(true) }

  function handleFile(file: File | null) {
    if (!file) return
    setImageSource(file)
    setPreview(URL.createObjectURL(file))
  }

  function handlePaste(e: ClipboardEvent) {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        handleFile(item.getAsFile())
        break
      }
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError(t('common.errNoTitle') as string); return }

    setLoading(true)
    setError('')
    try {
      await onSubmit(name.trim(), imageSource, null, extras)
      onClose()
    } catch {
      setError(t('common.errAdd') as string)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`modal-backdrop${closing ? ' modal-backdrop--closing' : ''}`}
      onClick={e => { if (e.target === e.currentTarget) close() }}
      onAnimationEnd={e => { if (e.animationName === 'modal-out') onClose() }}
    >
      <div className="modal">
        <button className="modal__close" onClick={close}>×</button>
        <h2 className="modal__title">{title}</h2>

        <input
          className="modal__input"
          placeholder={t('common.titlePlaceholder') as string}
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />

        <div
          className={`modal__upload-zone${preview ? ' modal__upload-zone--filled' : ''}`}
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onPaste={handlePaste}
        >
          {preview
            ? <img src={preview} className="modal__upload-preview" alt="preview" />
            : <span>{t('common.uploadHint') as string}</span>
          }
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {extraFields.map(field => (
          <input
            key={field.name}
            className="modal__input"
            placeholder={field.placeholder}
            value={extras[field.name] ?? ''}
            onChange={e => setExtras(prev => ({ ...prev, [field.name]: e.target.value }))}
          />
        ))}

        {error && <p className="modal__error">{error}</p>}

        <button className="modal__submit" onClick={handleSubmit} disabled={loading}>
          {loading ? t('common.adding') as string : t('common.add') as string}
        </button>
      </div>
    </div>
  )
}
