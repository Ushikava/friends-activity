import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import NavBar from '../../components/NavBar/NavBar'
import GameCard from '../../components/GameCard/GameCard'
import Pagination from '../../components/Pagination/Pagination'
import { fetchGames, addGame, deleteGame, searchSteam, fetchSteamImage, fetchGamePageNumber } from '../../api/games'
import type { SteamGame } from '../../api/games'
import { getRole } from '../../api/auth'
import { useLang } from '../../i18n/LangContext'
import { containerVariants, cardVariants } from '../../utils/animations'
import type { Game } from '../../types'
import '../page.css'
import '../../components/MediaGrid/mediaGrid.css'
import './Games.css'

const PAGE_SIZE = 20

type Tab = 'steam' | 'manual'

interface AddGameModalProps {
  onClose: () => void
  onAdd: (game: Game) => void
}

function AddGameModal({ onClose, onAdd }: AddGameModalProps) {
  const { t } = useLang()
  const [closing, setClosing] = useState(false)
  const [tab, setTab] = useState<Tab>('steam')

  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<SteamGame[]>([])
  const [selected, setSelected] = useState<SteamGame | null>(null)
  const [steamErr, setSteamErr] = useState('')
  const [adding, setAdding] = useState(false)

  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [steamLink, setSteamLink] = useState('')
  const [manualErr, setManualErr] = useState('')
  const [manualAdding, setManualAdding] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function close() { setClosing(true) }

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) { setResults([]); setSteamErr(''); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      setSteamErr('')
      setSelected(null)
      setResults([])
      try {
        const data = await searchSteam(trimmed)
        setResults(data)
        if (data.length === 0) setSteamErr(t('games.noResults'))
      } catch {
        setSteamErr(t('games.steamError'))
      } finally {
        setSearching(false)
      }
    }, 600)
    return () => clearTimeout(timer)
  }, [query])

  async function handleAddFromSteam() {
    if (!selected) return
    setAdding(true)
    setSteamErr('')
    try {
      const link = `https://store.steampowered.com/app/${selected.appid}/`
      const { cover_url } = await fetchSteamImage(selected.appid)
      const game = await addGame(selected.name, null, cover_url, link)
      onAdd(game)
      onClose()
    } catch {
      setSteamErr(t('common.errAdd'))
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
      const game = await addGame(title.trim(), file, null, steamLink.trim() || null)
      onAdd(game)
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
      <div className="modal modal--game" onPaste={handlePaste}>
        <button className="modal__close" onClick={close}>×</button>
        <h2 className="modal__title">{t('games.add')}</h2>

        <div className="game-tabs">
          <button
            type="button"
            className={`game-tab${tab === 'steam' ? ' game-tab--active' : ''}`}
            onClick={() => setTab('steam')}
          >
            Steam
          </button>
          <button
            type="button"
            className={`game-tab${tab === 'manual' ? ' game-tab--active' : ''}`}
            onClick={() => setTab('manual')}
          >
            {t('games.addManual')}
          </button>
        </div>

        {tab === 'steam' && (
          <>
            <div className="steam-search-wrap">
              <input
                className="modal__input"
                placeholder={t('games.searchPlaceholder')}
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
              />
              {searching && <span className="steam-search-spinner" />}
            </div>

            {steamErr && <p className="modal__error">{steamErr}</p>}

            {results.length > 0 && (
              <ul className="steam-results">
                {results.map(r => (
                  <li
                    key={r.appid}
                    className={`steam-result${selected?.appid === r.appid ? ' steam-result--selected' : ''}`}
                    onClick={() => setSelected(r)}
                  >
                    <img
                      src={r.thumbnail}
                      alt={r.name}
                      className="steam-result__img"
                    />
                    <span className="steam-result__name">{r.name}</span>
                  </li>
                ))}
              </ul>
            )}

            {selected && (
              <button
                type="button"
                className="modal__submit"
                onClick={handleAddFromSteam}
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
            <input
              className="modal__input"
              placeholder={t('games.steamLink')}
              value={steamLink}
              onChange={e => setSteamLink(e.target.value)}
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

export default function Games() {
  const { t } = useLang()
  const [searchParams, setSearchParams] = useSearchParams()
  const deepLinkId = searchParams.get('game')
  const [deepLinkReady, setDeepLinkReady] = useState(!deepLinkId)
  const deepLinkPageResolved = useRef(!deepLinkId)
  const [games, setGames] = useState<Game[]>([])
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'played' | 'unplayed'>('all')
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
  }, [debouncedQuery, statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!deepLinkId) return
    fetchGamePageNumber(Number(deepLinkId), PAGE_SIZE)
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
    fetchGames(page, PAGE_SIZE, q, st)
      .then(data => { setGames(data.items); setTotal(data.total) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page, debouncedQuery, statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

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

  function handlePlayUpdated(updated: Game) {
    setGames(p => p.map(g => g.id === updated.id ? updated : g))
  }

  function handleDelete(id: number) {
    const isLastOnPage = games.length === 1 && page > 1
    deleteGame(id)
      .then(() => {
        if (String(id) === deepLinkId) setSearchParams({}, { replace: true })
        if (isLastOnPage) {
          setPage(p => p - 1)
        } else {
          const q = debouncedQuery.trim() || undefined
          const st = statusFilter !== 'all' ? statusFilter : undefined
          fetchGames(page, PAGE_SIZE, q, st)
            .then(data => { setGames(data.items); setTotal(data.total) })
            .catch(console.error)
        }
      })
      .catch(() => showErr(t('common.errDeleteFail')))
  }

  function handleGameAdded(game: Game) {
    if (page === 1 && !debouncedQuery && statusFilter === 'all') {
      setGames(p => [game, ...p.slice(0, PAGE_SIZE - 1)])
      setTotal(n => n + 1)
    } else {
      setDebouncedQuery('')
      setSearchQuery('')
      setStatusFilter('all')
      setPage(1)
    }
  }

  const isSearchActive = debouncedQuery.trim() !== '' || statusFilter !== 'all'
  const currentDeepLinkId = isSearchActive ? null : deepLinkId

  return (
    <div className="page">
      <NavBar />
      <main className="page__main">
        {errMsg && <p className="page-error">{errMsg}</p>}

        <div className="media-header">
          <h1 className="media-header__title">{t('games.title')}</h1>

          <div className="media-header__controls">
            <div className={`media-search${searchOpen ? ' media-search--open' : ''}`}>
              <input
                ref={searchInputRef}
                className="media-search__input"
                placeholder={t('games.gridSearch')}
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
              className={`media-header__icon-btn${filterOpen || statusFilter !== 'all' ? ' media-header__icon-btn--active' : ''}`}
              onClick={() => setFilterOpen(v => !v)}
              title="Фильтр"
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
            {(['all', 'played', 'unplayed'] as const).map(val => (
              <button
                key={val}
                className={`media-filter-pill${statusFilter === val ? ' media-filter-pill--active' : ''}`}
                onClick={() => setStatusFilter(val)}
              >
                {t(`games.filter${val.charAt(0).toUpperCase() + val.slice(1)}` as Parameters<typeof t>[0])}
              </button>
            ))}
          </div>
        )}

        {loading
          ? <div className="loading-spinner" />
          : games.length === 0
          ? <p className="media-empty">{isSearchActive ? t('games.noSearchResults') : t('common.empty')}</p>
          : (
            <motion.div
              className="media-grid"
              variants={containerVariants}
              initial={currentDeepLinkId ? false : 'hidden'}
              animate="show"
              style={currentDeepLinkId && !deepLinkReady ? { visibility: 'hidden' } : undefined}
            >
              {games.map(g => (
                <motion.div key={g.id} variants={cardVariants}>
                  <GameCard
                    game={g}
                    canEdit={canEdit}
                    onDelete={handleDelete}
                    onPlayUpdated={handlePlayUpdated}
                    deepLinkReady={g.id === Number(currentDeepLinkId) ? deepLinkReady : undefined}
                    onDeepLinkReady={g.id === Number(currentDeepLinkId) ? () => setDeepLinkReady(true) : undefined}
                  />
                </motion.div>
              ))}
            </motion.div>
          )
        }

        <Pagination page={page} total={total} limit={PAGE_SIZE} onChange={setPage} />

        {showModal && (
          <AddGameModal
            onClose={() => setShowModal(false)}
            onAdd={handleGameAdded}
          />
        )}
      </main>
    </div>
  )
}
