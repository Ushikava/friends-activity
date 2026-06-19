import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import NavBar from '../../components/NavBar/NavBar'
import MovieCard from '../../components/MovieCard/MovieCard'
import Pagination from '../../components/Pagination/Pagination'
import { fetchMovies, addMovie, deleteMovie, searchTmdb, fetchMoviePageNumber, fetchRandomMovie } from '../../api/movies'
import type { TmdbMovie } from '../../api/movies'
import { SparklesIcon } from '@heroicons/react/24/outline'
import ParticleBurst from '../../components/ParticleBurst/ParticleBurst'
const API = import.meta.env.VITE_API_URL

const MOVIE_EMOJIS = ['🎬', '⭐', '🍿', '🎭', '🎥', '🎦']
import { getRole } from '../../api/auth'
import { useLang } from '../../i18n/LangContext'
import { containerVariants, cardVariants } from '../../utils/animations'
import type { Movie } from '../../types'
import '../page.css'
import '../../components/MediaGrid/mediaGrid.css'
import './Movies.css'

const PAGE_SIZE = 40

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
  const [searchParams, setSearchParams] = useSearchParams()
  const deepLinkId = searchParams.get('movie')
  const [deepLinkReady, setDeepLinkReady] = useState(!deepLinkId)
  const deepLinkPageResolved = useRef(!deepLinkId)
  const [movies, setMovies] = useState<Movie[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(deepLinkId ? 0 : 1)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [errMsg, setErrMsg] = useState('')
  const canEdit = getRole() !== 'observer'

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'watched' | 'unwatched'>('all')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [randomLoading, setRandomLoading] = useState(false)
  const [showBurst, setShowBurst] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  function showErr(msg: string) {
    setErrMsg(msg)
    setTimeout(() => setErrMsg(''), 4000)
  }

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Reset to page 1 when search/filter changes (after deep link resolved)
  useEffect(() => {
    if (!deepLinkPageResolved.current) return
    if (deepLinkId) setSearchParams({}, { replace: true })
    setPage(1)
  }, [debouncedQuery, statusFilter, favoritesOnly]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!deepLinkId) return
    fetchMoviePageNumber(Number(deepLinkId), PAGE_SIZE)
      .then(targetPage => {
        deepLinkPageResolved.current = true
        if (targetPage === null) { setDeepLinkReady(true); setPage(1); return }
        setPage(targetPage)
      })
      .catch(() => { deepLinkPageResolved.current = true; setDeepLinkReady(true); setPage(1) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (page === 0) return
    setLoading(true)
    const q = debouncedQuery.trim() || undefined
    const st = statusFilter !== 'all' ? statusFilter : undefined
    fetchMovies(page, PAGE_SIZE, q, st, favoritesOnly || undefined)
      .then(data => { setMovies(data.items); setTotal(data.total) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page, debouncedQuery, statusFilter, favoritesOnly]) // eslint-disable-line react-hooks/exhaustive-deps

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
    const isLastOnPage = movies.length === 1 && page > 1
    deleteMovie(id)
      .then(() => {
        if (String(id) === deepLinkId) setSearchParams({}, { replace: true })
        if (isLastOnPage) {
          setPage(p => p - 1)
        } else {
          const q = debouncedQuery.trim() || undefined
          const st = statusFilter !== 'all' ? statusFilter : undefined
          fetchMovies(page, PAGE_SIZE, q, st, favoritesOnly || undefined)
            .then(data => { setMovies(data.items); setTotal(data.total) })
            .catch(console.error)
        }
      })
      .catch(() => showErr(t('common.errDeleteFail')))
  }

  function handleWatchUpdated(updated: Movie) {
    setMovies(p => p.map(m => m.id === updated.id ? updated : m))
  }

  function handleMovieAdded(movie: Movie) {
    if (page === 1 && !debouncedQuery && statusFilter === 'all' && !favoritesOnly) {
      setMovies(p => [movie, ...p.slice(0, PAGE_SIZE - 1)])
      setTotal(n => n + 1)
    } else {
      setDebouncedQuery('')
      setSearchQuery('')
      setStatusFilter('all')
      setFavoritesOnly(false)
      setPage(1)
    }
  }

  function handleToggleFavorite(id: number, isFav: boolean) {
    if (favoritesOnly && !isFav) {
      setMovies(p => p.filter(m => m.id !== id))
      setTotal(n => n - 1)
    } else {
      setMovies(p => p.map(m => m.id === id ? { ...m, is_favorite: isFav } : m))
    }
  }

  async function handleRandom() {
    if (randomLoading) return
    setRandomLoading(true)
    try {
      const result = await fetchRandomMovie(favoritesOnly)
      if (!result) return
      setSearchQuery('')
      setDebouncedQuery('')
      setStatusFilter('all')
      setFavoritesOnly(false)
      setShowBurst(true)
      setSearchParams({ movie: String(result.id) }, { replace: true })
    } catch {
      showErr(t('common.errAction') as string)
    } finally {
      setRandomLoading(false)
    }
  }

  const isSearchActive = debouncedQuery.trim() !== '' || statusFilter !== 'all' || favoritesOnly
  const currentDeepLinkId = isSearchActive ? null : deepLinkId

  return (
    <div className="page">
      <NavBar />
      <main className="page__main">
        {errMsg && <p className="page-error">{errMsg}</p>}

        <div className="media-header">
          <h1 className="media-header__title">{t('movies.title')}</h1>

          <div className="media-header__controls">
            <div className={`media-search${searchOpen ? ' media-search--open' : ''}`}>
              <input
                ref={searchInputRef}
                className="media-search__input"
                placeholder={t('movies.gridSearch')}
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
              className={`media-header__icon-btn${filterOpen || statusFilter !== 'all' || favoritesOnly ? ' media-header__icon-btn--active' : ''}`}
              onClick={() => setFilterOpen(v => !v)}
              title="Фильтр"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
            </button>

            <button
              className={`media-header__icon-btn${randomLoading ? ' media-header__icon-btn--loading' : ''}`}
              onClick={handleRandom}
              title={t('movies.randomTitle') as string}
              disabled={randomLoading}
            >
              <SparklesIcon width={22} height={22} />
            </button>

            {canEdit && (
              <button className="media-header__add" onClick={() => setShowModal(true)}>+</button>
            )}
          </div>
        </div>

        {filterOpen && (
          <div className="media-filter-bar">
            {(['all', 'watched', 'unwatched'] as const).map(val => (
              <button
                key={val}
                className={`media-filter-pill${statusFilter === val && !favoritesOnly ? ' media-filter-pill--active' : ''}`}
                onClick={() => { setStatusFilter(val); setFavoritesOnly(false) }}
              >
                {t(`movies.filter${val.charAt(0).toUpperCase() + val.slice(1)}` as Parameters<typeof t>[0])}
              </button>
            ))}
            <button
              className={`media-filter-pill${favoritesOnly ? ' media-filter-pill--active' : ''}`}
              onClick={() => { setFavoritesOnly(v => !v); setStatusFilter('all') }}
            >
              {t('movies.filterFavorites')}
            </button>
          </div>
        )}

        {loading
          ? <div className="loading-spinner" />
          : movies.length === 0
          ? <p className="media-empty">{favoritesOnly ? t('movies.noFavorites') : isSearchActive ? t('movies.noSearchResults') : t('common.empty')}</p>
          : (
            <motion.div
              className="media-grid"
              variants={containerVariants}
              initial={currentDeepLinkId ? false : 'hidden'}
              animate="show"
              style={currentDeepLinkId && !deepLinkReady ? { visibility: 'hidden' } : undefined}
            >
              {movies.map(m => (
                <motion.div key={m.id} variants={cardVariants}>
                  <MovieCard
                    movie={m}
                    canEdit={canEdit}
                    onDelete={handleDelete}
                    onWatchUpdated={handleWatchUpdated}
                    onToggleFavorite={handleToggleFavorite}

                    deepLinkReady={m.id === Number(currentDeepLinkId) ? deepLinkReady : undefined}
                    onDeepLinkReady={m.id === Number(currentDeepLinkId) ? () => setDeepLinkReady(true) : undefined}
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

        {showBurst && (
          <ParticleBurst emojis={MOVIE_EMOJIS} onDone={() => setShowBurst(false)} />
        )}
      </main>
    </div>
  )
}
