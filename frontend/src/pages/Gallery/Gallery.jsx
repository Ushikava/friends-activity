import { useState, useEffect, useRef } from 'react'
import NavBar from '../../components/NavBar/NavBar'
import { fetchPhotos, uploadPhoto, deletePhoto, photoSrc } from '../../api/photos'
import { getRole } from '../../api/auth'
import '../page.css'
import '../../components/MediaGrid/mediaGrid.css'
import './Gallery.css'

function UploadModal({ onClose, onUploaded }) {
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
    if (!imageSource) { setError('Выберите изображение'); return }

    setLoading(true)
    setError('')
    try {
      const photo = await uploadPhoto(imageSource, description.trim() || null)
      onUploaded(photo)
      onClose()
    } catch {
      setError('Не удалось загрузить')
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
        <h2 className="modal__title">Добавить фото</h2>

        <div
          ref={uploadZoneRef}
          className={`modal__upload-zone${preview ? ' modal__upload-zone--filled' : ''}`}
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onPaste={handlePaste}
        >
          {preview
            ? <img src={preview} className="modal__upload-preview" alt="preview" />
            : <span>Нажмите или вставьте (Ctrl+V)</span>
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
          placeholder="Описание (необязательно)"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        {error && <p className="modal__error">{error}</p>}

        <button className="modal__submit" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Загружаем…' : 'Загрузить'}
        </button>
      </div>
    </div>
  )
}

function Lightbox({ photo, onClose, onDelete, canEdit }) {
  const src = photoSrc(photo.filename)
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
        <img src={src} alt={photo.description || ''} className="lightbox__img" />
        {photo.description && (
          <p className="lightbox__desc">{photo.description}</p>
        )}
        {canEdit && (
          <button
            className="lightbox__delete"
            onClick={() => { onDelete(photo.id); onClose() }}
          >Удалить</button>
        )}
      </div>
    </div>
  )
}

export default function Gallery() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const canEdit = getRole() !== 'observer'

  useEffect(() => {
    fetchPhotos().then(setPhotos).catch(console.error).finally(() => setLoading(false))
  }, [])

  function handleDelete(id) {
    deletePhoto(id)
      .then(() => setPhotos(p => p.filter(ph => ph.id !== id)))
      .catch(console.error)
  }

  return (
    <div className="page">
      <NavBar />
      <main className="page__main">
        <div className="media-header">
          <h1 className="media-header__title">Галерея</h1>
          {canEdit && (
            <button className="media-header__add" onClick={() => setShowModal(true)}>+</button>
          )}
        </div>

        {loading
          ? <div className="loading-spinner" />
          : photos.length === 0
          ? <p className="media-empty">Пока ничего нет</p>
          : (
            <div className="gallery-grid">
              {photos.map(photo => (
                <div
                  key={photo.id}
                  className="gallery-item"
                  onClick={() => setSelected(photo)}
                >
                  <img
                    src={photoSrc(photo.filename)}
                    alt={photo.description || ''}
                    className="gallery-item__img"
                  />
                  {photo.description && (
                    <p className="gallery-item__desc">{photo.description}</p>
                  )}
                </div>
              ))}
            </div>
          )
        }

        {showModal && (
          <UploadModal
            onClose={() => setShowModal(false)}
            onUploaded={photo => setPhotos(p => [photo, ...p])}
          />
        )}

        {selected && (
          <Lightbox
            photo={selected}
            onClose={() => setSelected(null)}
            onDelete={handleDelete}
            canEdit={canEdit}
          />
        )}
      </main>
    </div>
  )
}
