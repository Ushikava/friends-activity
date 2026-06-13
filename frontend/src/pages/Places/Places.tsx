import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import NavBar from '../../components/NavBar/NavBar'
import Pagination from '../../components/Pagination/Pagination'
import Lightbox from '../../components/Lightbox/Lightbox'
import { fetchPlaces, uploadPlace, deletePlace, placeSrc } from '../../api/places'
import { getRole } from '../../api/auth'
import { useLang } from '../../i18n/LangContext'
import { containerVariants, cardVariants } from '../../utils/animations'
import type { Place } from '../../types'
import '../page.css'
import '../../components/MediaGrid/mediaGrid.css'
import '../Gallery/Gallery.css'

const PAGE_SIZE = 20

interface UploadModalProps {
  onClose: () => void
  onUploaded: (place: Place) => void
}

function UploadModal({ onClose, onUploaded }: UploadModalProps) {
  const { t } = useLang()
  const [closing, setClosing] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [imageSource, setImageSource] = useState<File | null>(null)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadZoneRef = useRef<HTMLDivElement>(null)

  useEffect(() => { uploadZoneRef.current?.focus() }, [])

  function close() { setClosing(true) }

  function handleFile(file: File | null) {
    if (!file) return
    setImageSource(file)
    setPreview(URL.createObjectURL(file))
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        handleFile(item.getAsFile())
        break
      }
    }
  }

  async function handleSubmit(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    if (!imageSource) { setError(t('common.errNoFile')); return }

    setLoading(true)
    setError('')
    try {
      const place = await uploadPlace(imageSource, description.trim() || undefined)
      onUploaded(place)
      onClose()
    } catch {
      setError(t('common.errUpload'))
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
        <h2 className="modal__title">{t('gallery.addPhoto')}</h2>

        <div
          ref={uploadZoneRef}
          className={`modal__upload-zone${preview ? ' modal__upload-zone--filled' : ''}`}
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onPaste={handlePaste}
        >
          {preview
            ? <img src={preview} className="modal__upload-preview" alt="preview" />
            : <span>{t('common.uploadHint')}</span>
          }
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <input
          className="modal__input"
          placeholder={t('common.descPlaceholder')}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        {error && <p className="modal__error">{error}</p>}

        <button className="modal__submit" onClick={handleSubmit} disabled={loading}>
          {loading ? t('common.uploading') : t('common.upload')}
        </button>
      </div>
    </div>
  )
}


export default function Places() {
  const { t } = useLang()
  const [places, setPlaces] = useState<Place[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<Place | null>(null)
  const [errMsg, setErrMsg] = useState('')
  const canEdit = getRole() !== 'observer'

  function showErr(msg: string) {
    setErrMsg(msg)
    setTimeout(() => setErrMsg(''), 4000)
  }

  useEffect(() => {
    setLoading(true)
    fetchPlaces(page, PAGE_SIZE)
      .then(data => { setPlaces(data.items); setTotal(data.total) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page])

  function handleDelete(id: number) {
    const isLastOnPage = places.length === 1 && page > 1
    deletePlace(id)
      .then(() => {
        setPlaces(p => p.filter(pl => pl.id !== id))
        setTotal(n => n - 1)
        if (isLastOnPage) setPage(p => p - 1)
      })
      .catch(() => showErr(t('common.errDeleteFail')))
  }

  function handleUploaded(place: Place) {
    if (page === 1) {
      setPlaces(p => [place, ...p.slice(0, PAGE_SIZE - 1)])
      setTotal(n => n + 1)
    } else {
      setPage(1)
    }
  }

  return (
    <div className="page">
      <NavBar />
      <main className="page__main">
        {errMsg && <p className="page-error">{errMsg}</p>}
        <div className="media-header">
          <h1 className="media-header__title">{t('places.title')}</h1>
          {canEdit && (
            <button className="media-header__add" onClick={() => setShowModal(true)}>+</button>
          )}
        </div>

        {loading
          ? <div className="loading-spinner" />
          : places.length === 0 && total === 0
          ? <p className="media-empty">{t('common.empty')}</p>
          : (
            <>
              <motion.div
                className="gallery-grid"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {places.map(place => (
                  <motion.div
                    key={place.id}
                    className="gallery-item"
                    variants={cardVariants}
                    onClick={() => setSelected(place)}
                  >
                    <img
                      src={placeSrc(place.filename) ?? undefined}
                      alt={place.description || ''}
                      className="gallery-item__img"
                    />
                    {place.description && (
                      <p className="gallery-item__desc">{place.description}</p>
                    )}
                  </motion.div>
                ))}
              </motion.div>
              <Pagination page={page} total={total} limit={PAGE_SIZE} onChange={setPage} />
            </>
          )
        }

        {showModal && (
          <UploadModal
            onClose={() => setShowModal(false)}
            onUploaded={handleUploaded}
          />
        )}

        {selected && (
          <Lightbox
            src={placeSrc(selected.filename) ?? ''}
            description={selected.description ?? undefined}
            createdAt={selected.uploaded_at}
            onClose={() => setSelected(null)}
            onDelete={canEdit ? () => handleDelete(selected.id) : undefined}
          />
        )}
      </main>
    </div>
  )
}
