import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import NavBar from '../../components/NavBar/NavBar'
import Pagination from '../../components/Pagination/Pagination'
import Lightbox from '../../components/Lightbox/Lightbox'
import { fetchPhotos, fetchPhotoById, uploadPhoto, deletePhoto, updatePhotoDescription, photoSrc } from '../../api/photos'
import { getRole } from '../../api/auth'
import { useLang } from '../../i18n/LangContext'
import { containerVariants, cardVariants } from '../../utils/animations'
import type { Photo } from '../../types'
import '../page.css'
import '../../components/MediaGrid/mediaGrid.css'
import './Gallery.css'

const PAGE_SIZE = 20

interface UploadModalProps {
  onClose: () => void
  onUploaded: (photo: Photo) => void
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
        const raw = item.getAsFile()
        if (!raw) break
        const ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' } as Record<string, string>)[item.type] ?? 'png'
        handleFile(new File([raw], `paste.${ext}`, { type: item.type }))
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
      const photo = await uploadPhoto(imageSource, description.trim() || undefined)
      onUploaded(photo)
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


export default function Gallery() {
  const { t } = useLang()
  const [searchParams, setSearchParams] = useSearchParams()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<Photo | null>(null)
  const canEdit = getRole() !== 'observer'

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => { setPage(1) }, [debouncedQuery, sort])

  useEffect(() => {
    setLoading(true)
    const q = debouncedQuery.trim() || undefined
    fetchPhotos(page, PAGE_SIZE, q, sort)
      .then(data => { setPhotos(data.items); setTotal(data.total) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page, debouncedQuery, sort])

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) fetchPhotoById(Number(id)).then(setSelected).catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchToggle = useCallback(() => {
    if (searchOpen && !searchQuery) {
      setSearchOpen(false)
    } else if (!searchOpen) {
      setSearchOpen(true)
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
  }, [searchOpen, searchQuery])

  function handleSearchClear() {
    setSearchQuery('')
    setSearchOpen(false)
  }

  function handleDelete(id: number) {
    const isLastOnPage = photos.length === 1 && page > 1
    deletePhoto(id)
      .then(() => {
        if (isLastOnPage) {
          setPage(p => p - 1)
        } else {
          const q = debouncedQuery.trim() || undefined
          fetchPhotos(page, PAGE_SIZE, q, sort)
            .then(data => { setPhotos(data.items); setTotal(data.total) })
            .catch(console.error)
        }
      })
      .catch(console.error)
  }

  function handleUploaded(photo: Photo) {
    if (page === 1 && !debouncedQuery && sort === 'newest') {
      setPhotos(p => [photo, ...p.slice(0, PAGE_SIZE - 1)])
      setTotal(n => n + 1)
    } else {
      setDebouncedQuery('')
      setSearchQuery('')
      setSort('newest')
      setPage(1)
    }
  }

  const isSearchActive = debouncedQuery.trim() !== ''

  return (
    <div className="page">
      <NavBar />
      <main className="page__main">
        <div className="media-header">
          <h1 className="media-header__title">{t('gallery.title')}</h1>

          <div className="media-header__controls">
            <div className={`media-search${searchOpen ? ' media-search--open' : ''}`}>
              <input
                ref={searchInputRef}
                className="media-search__input"
                placeholder={t('gallery.gridSearch')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape') handleSearchClear() }}
              />
            </div>

            <button
              className={`media-header__icon-btn${searchOpen || debouncedQuery ? ' media-header__icon-btn--active' : ''}`}
              onClick={searchOpen && searchQuery ? handleSearchClear : handleSearchToggle}
              title="Поиск"
            >
              {searchOpen && searchQuery
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              }
            </button>

            <button
              className={`media-header__icon-btn${filterOpen || sort !== 'newest' ? ' media-header__icon-btn--active' : ''}`}
              onClick={() => setFilterOpen(v => !v)}
              title="Сортировка"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
            </button>

            {canEdit && (
              <button className="media-header__add" onClick={() => setShowModal(true)}>+</button>
            )}
          </div>
        </div>

        {filterOpen && (
          <div className="media-filter-bar">
            {(['newest', 'oldest'] as const).map(val => (
              <button
                key={val}
                className={`media-filter-pill${sort === val ? ' media-filter-pill--active' : ''}`}
                onClick={() => setSort(val)}
              >
                {t(`gallery.sort${val.charAt(0).toUpperCase() + val.slice(1)}` as Parameters<typeof t>[0])}
              </button>
            ))}
          </div>
        )}

        {loading
          ? <div className="loading-spinner" />
          : photos.length === 0
          ? <p className="media-empty">{isSearchActive ? t('gallery.noSearchResults') : t('common.empty')}</p>
          : (
            <>
              <motion.div
                className="gallery-grid"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {photos.map(photo => (
                  <motion.div
                    key={photo.id}
                    className="gallery-item"
                    variants={cardVariants}
                    onClick={() => { setSelected(photo); setSearchParams({ id: String(photo.id) }, { replace: true }) }}
                  >
                    <img
                      src={photoSrc(photo.filename) ?? undefined}
                      alt={photo.description || ''}
                      className="gallery-item__img"
                    />
                    {photo.description && (
                      <p className="gallery-item__desc">{photo.description}</p>
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
            src={photoSrc(selected.filename) ?? ''}
            description={selected.description ?? undefined}
            createdAt={selected.uploaded_at}
            onClose={() => { setSelected(null); setSearchParams({}, { replace: true }) }}
            onDelete={canEdit ? () => handleDelete(selected.id) : undefined}
            onSaveDescription={canEdit ? async (desc) => {
              await updatePhotoDescription(selected.id, desc)
              setPhotos(p => p.map(ph => ph.id === selected.id ? { ...ph, description: desc } : ph))
              setSelected(s => s ? { ...s, description: desc } : s)
            } : undefined}
          />
        )}
      </main>
    </div>
  )
}
