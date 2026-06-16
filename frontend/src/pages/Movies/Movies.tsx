import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import NavBar from '../../components/NavBar/NavBar'
import MovieCard from '../../components/MovieCard/MovieCard'
import Pagination from '../../components/Pagination/Pagination'
import { fetchMovies, addMovie, deleteMovie, searchTmdb } from '../../api/movies'
import type { TmdbMovie } from '../../api/movies'

const API = import.meta.env.VITE_API_URL
import { getRole } from '../../api/auth'
import { useLang } from '../../i18n/LangContext'
import { containerVariants, cardVariants } from '../../utils/animations'
import type { Movie } from '../../types'
import '../page.css'
import '../../components/MediaGrid/mediaGrid.css'
import './Movies.css'

const PAGE_SIZE = 20

type Tab = 'tmdb' | 'manual'

interface AddMovieModalProps {
  onClose: () => void
  onAdd: (movie: Movie) => void
}

function AddMovieModal({ onClose, onAdd }: AddMovieModalProps) {
  const { t } = useLang()
  const [closing, setClosing] = useState(false)
  const [tab, setTab] = useState<Tab>('tmdb')

  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<TmdbMovie[]>([])
  const [selected, setSelected] = useState<TmdbMovie | null>(null)
  const [tmdbErr, setTmdbErr] = useState('')
  const [adding, setAdding] = useState(false)

  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [manualErr, setManualErr] = useState('')
  const [manualAdding, setManualAdding] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function close() { setClosing(true) }

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) { setResults([]); setTmdbErr(''); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      setTmdbErr('')
      setSelected(null)
      setResults([])
      try {
        const data = await searchTmdb(trimmed)
        setResults(data)
        if (data.length === 0) setTmdbErr(t('movies.noResults'))
      } catch {
        setTmdbErr(t('movies.tmdbError'))
      } finally {
        setSearching(false)
      }
    }, 600)
    return () => clearTimeout(timer)
  }, [query])

  async function handleAddFromTmdb() {
    if (!selected) return
    setAdding(true)
    setTmdbErr('')
    try {
      const posterUrl = selected.poster_path ? `https://image.tmdb.org/t/p/w500${selected.poster_path}` : null
      const movie = await addMovie(selected.title, null, posterUrl)
      onAdd(movie)
      onClose()
    } catch {
      setTmdbErr(t('common.errAdd'))
    } finally {
      setAdding(false)
    }
  }

  function handleFile(f: File | null) {
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  function handlePaste(e: React.ClipboardEvent) {
    if (tab !== 'manual') return
    const imageItem = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'))
    if (!imageItem) return
    e.preventDefault()
    const raw = imageItem.getAsFile()
    if (!raw) return
    const ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' } as Record<string, string>)[imageItem.type] ?? 'png'
    handleFile(new File([raw], `paste.${ext}`, { type: imageItem.type }))
  }

  async function handleManualAdd() {
    if (!title.trim()) { setManualErr(t('common.errNoTitle')); return }
    setManualAdding(true)
    setManualErr('')
    try {
      const movie = await addMovie(title.trim(), file, null)
      onAdd(movie)
      onClose()
    } catch {
      setManualErr(t('common.errAdd'))
    } finally {
      setManualAdding(false)
    }
  }

  return (
    <div
      className={`modal-backdrop${closing ? ' modal-backdrop--closing' : ''}`}
      onClick={e => { if (e.target === e.currentTarget) close() }}
      onAnimationEnd={e => { if (e.animationName === 'modal-out') onClose() }}
    >
      <div className="modal modal--movie" onPaste={handlePaste}>
        <button className="modal__close" onClick={close}>×</button>
        <h2 className="modal__title">{t('movies.add')}</h2>

        <div className="movie-tabs">
          <button
            type="button"
            className={`movie-tab${tab === 'tmdb' ? ' movie-tab--active' : ''}`}
            onClick={() => setTab('tmdb')}
          >
            TMDB
          </button>
          <button
            type="button"
            className={`movie-tab${tab === 'manual' ? ' movie-tab--active' : ''}`}
            onClick={() => setTab('manual')}
          >
            {t('movies.addManual')}
          </button>
        </div>

        {tab === 'tmdb' && (
          <>
            <div className="tmdb-search-wrap">
              <input
                className="modal__input"
                placeholder={t('movies.searchPlaceholder')}
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
              />
              {searching && <span className="tmdb-search-spinner" />}
            </div>

            {tmdbErr && <p className="modal__error">{tmdbErr}</p>}

            {results.length > 0 && (
              <ul className="tmdb-results">
                {results.map(r => (
                  <li
                    key={r.tmdb_id}
                    className={`tmdb-result${selected?.tmdb_id === r.tmdb_id ? ' tmdb-result--selected' : ''}`}
                    onClick={() => setSelected(r)}
                  >
                    {r.poster_path
                      ? <img src={`${API}/movies/tmdb-poster?path=${encodeURIComponent(r.poster_path)}&size=w92`} alt={r.title} className="tmdb-result__img" />
                      : <div className="tmdb-result__img tmdb-result__img--empty" />
                    }
                    <span className="tmdb-result__name">
                      {r.title}{r.year ? ` (${r.year})` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {selected && (
              <button
                type="button"
                className="modal__submit"
                onClick={handleAddFromTmdb}
                disabled={adding}
              >
                {adding ? t('common.adding') : t('common.add')}
              </button>
            )}
          </>
        )}

        {tab === 'manual' && (
          <form onSubmit={e => { e.preventDefault(); void handleManualAdd() }} style={{ display: 'contents' }}>
            <div
              className={`modal__upload-zone${preview ? ' modal__upload-zone--filled' : ''}`}
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
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
              placeholder={t('common.titlePlaceholder')}
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            {manualErr && <p className="modal__error">{manualErr}</p>}
            <button type="submit" className="modal__submit" disabled={manualAdding || !title.trim()}>
              {manualAdding ? t('common.adding') : t('common.add')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function Movies() {
  const { t } = useLang()
  const [movies, setMovies] = useState<Movie[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [errMsg, setErrMsg] = useState('')
  const canEdit = getRole() !== 'observer'

  function showErr(msg: string) {
    setErrMsg(msg)
    setTimeout(() => setErrMsg(''), 4000)
  }

  useEffect(() => {
    setLoading(true)
    fetchMovies(page, PAGE_SIZE)
      .then(data => { setMovies(data.items); setTotal(data.total) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page])

  function handleDelete(id: number) {
    const isLastOnPage = movies.length === 1 && page > 1
    deleteMovie(id)
      .then(() => {
        setMovies(p => p.filter(m => m.id !== id))
        setTotal(n => n - 1)
        if (isLastOnPage) setPage(p => p - 1)
      })
      .catch(() => showErr(t('common.errDeleteFail')))
  }

  function handleWatchUpdated(updated: Movie) {
    setMovies(p => p.map(m => m.id === updated.id ? updated : m))
  }

  function handleMovieAdded(movie: Movie) {
    if (page === 1) {
      setMovies(p => [movie, ...p.slice(0, PAGE_SIZE - 1)])
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
          <h1 className="media-header__title">{t('movies.title')}</h1>
          {canEdit && (
            <button className="media-header__add" onClick={() => setShowModal(true)}>+</button>
          )}
        </div>

        {loading
          ? <div className="loading-spinner" />
          : movies.length === 0
          ? <p className="media-empty">{t('common.empty')}</p>
          : (
            <motion.div
              className="media-grid"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {movies.map(m => (
                <motion.div key={m.id} variants={cardVariants}>
                  <MovieCard
                    movie={m}
                    canEdit={canEdit}
                    onDelete={handleDelete}
                    onWatchUpdated={handleWatchUpdated}
                  />
                </motion.div>
              ))}
            </motion.div>
          )
        }

        <Pagination page={page} total={total} limit={PAGE_SIZE} onChange={setPage} />

        {showModal && (
          <AddMovieModal
            onClose={() => setShowModal(false)}
            onAdd={handleMovieAdded}
          />
        )}
      </main>
    </div>
  )
}
