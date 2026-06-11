import { useState, useEffect, useRef } from 'react'
import NavBar from '../../components/NavBar/NavBar'
import Pagination from '../../components/Pagination/Pagination'
import { fetchPlaces, uploadPlace, deletePlace, placeSrc } from '../../api/places'
import { getRole } from '../../api/auth'
import { useLang } from '../../i18n/LangContext'
import '../page.css'
import '../../components/MediaGrid/mediaGrid.css'
import '../Gallery/Gallery.css'

const PAGE_SIZE = 20

function UploadModal({ onClose, onUploaded }) {
  const { t } = useLang()
  const [closing, setClosing] = useState(false)
  const [preview, setPreview] = useState(null)
  const [imageSource, setImageSource] = useState(null)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)
  const uploadZoneRef = useRef(null)

  useEffect(() => { uploadZoneRef.current?.focus() }, [])

  function close() { setClosing(true) }

  function handleFile(file) {
    if (!file) return
    setImageSource(file)
    setPreview(URL.createObjectURL(file))
  }

  function handlePaste(e) {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        handleFile(item.getAsFile())
        break
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!imageSource) { setError(t('common.errNoFile')); return }

    setLoading(true)
    setError('')
    try {
      const place = await uploadPlace(imageSource, description.trim() || null)
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
            onChange={e => handleFile(e.target.files[0])}
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

function Lightbox({ place, onClose, onDelete, canEdit }) {
  const { t } = useLang()
  const src = placeSrc(place.filename)
  const [closing, setClosing] = useState(false)

  function close() { setClosing(true) }

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div
      className={`lightbox${closing ? ' lightbox--closing' : ''}`}
      onClick={e => { if (e.target === e.currentTarget) close() }}
      onAnimationEnd={e => { if (e.animationName === 'lightbox-out') onClose() }}
    >
      <div className="lightbox__inner" onClick={e => { if (e.target === e.currentTarget) close() }}>
        <button className="lightbox__close" onClick={close}>×</button>
        <img src={src} alt={place.description || ''} className="lightbox__img" />
        {place.description && (
          <p className="lightbox__desc">{place.description}</p>
        )}
        {canEdit && (
          <button
            className="lightbox__delete"
            onClick={() => { onDelete(place.id); onClose() }}
          >{t('common.delete')}</button>
        )}
      </div>
    </div>
  )
}

export default function Places() {
  const { t } = useLang()
  const [places, setPlaces] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const canEdit = getRole() !== 'observer'

  useEffect(() => {
    setLoading(true)
    fetchPlaces(page, PAGE_SIZE)
      .then(data => { setPlaces(data.items); setTotal(data.total) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page])

  function handleDelete(id) {
    const isLastOnPage = places.length === 1 && page > 1
    deletePlace(id)
      .then(() => {
        setPlaces(p => p.filter(pl => pl.id !== id))
        setTotal(n => n - 1)
        if (isLastOnPage) setPage(p => p - 1)
      })
      .catch(console.error)
  }

  function handleUploaded(place) {
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
              <div className="gallery-grid">
                {places.map(place => (
                  <div
                    key={place.id}
                    className="gallery-item"
                    onClick={() => setSelected(place)}
                  >
                    <img
                      src={placeSrc(place.filename)}
                      alt={place.description || ''}
                      className="gallery-item__img"
                    />
                    {place.description && (
                      <p className="gallery-item__desc">{place.description}</p>
                    )}
                  </div>
                ))}
              </div>
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
            place={selected}
            onClose={() => setSelected(null)}
            onDelete={handleDelete}
            canEdit={canEdit}
          />
        )}
      </main>
    </div>
  )
}
