import { useState, useEffect } from 'react'
import { fetchGameDetail, toggleUserPlayed } from '../../api/games'
import { getRole, getUsername } from '../../api/auth'
import { useLang } from '../../i18n/LangContext'
import type { Game, GameDetail, GameUserStatus } from '../../types'
import './GameCard.css'

const UPLOADS = import.meta.env.VITE_UPLOADS_URL

function posterSrc(poster: string | null | undefined): string | null {
  if (!poster) return null
  if (poster.startsWith('http')) return poster
  return `${UPLOADS}/${poster}`
}

// ── Star rating ───────────────────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
}: {
  value: number | null
  onChange: (n: number | null) => void
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const display = hovered ?? value ?? 0
  const isHovering = hovered !== null

  return (
    <div className="star-rating" onMouseLeave={() => setHovered(null)}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
        <button
          key={n}
          type="button"
          className={`star-rating__star${
            n <= display
              ? isHovering
                ? ' star-rating__star--hover'
                : ' star-rating__star--active'
              : ''
          }`}
          onMouseEnter={() => setHovered(n)}
          onClick={() => onChange(n === value ? null : n)}
          aria-label={`${n} stars`}
        >★</button>
      ))}
      {value !== null && <span className="star-rating__value">{value}/10</span>}
    </div>
  )
}

// ── Review modal ──────────────────────────────────────────────────────────────

function ReviewModal({
  gameTitle,
  onConfirm,
  onCancel,
  loading,
}: {
  gameTitle: string
  onConfirm: (rating: number | null, review: string) => void
  onCancel: () => void
  loading: boolean
}) {
  const { t } = useLang()
  const [rating, setRating] = useState<number | null>(null)
  const [review, setReview] = useState('')

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div
      className="review-backdrop"
      onClick={e => { e.stopPropagation(); if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="review-modal" onClick={e => e.stopPropagation()}>
        <h3 className="review-modal__title">{t('games.rateTitle')}</h3>
        <p className="review-modal__movie">{gameTitle}</p>

        <div className="review-modal__section">
          <span className="review-modal__label">{t('games.ratingLabel')}</span>
          <StarRating value={rating} onChange={setRating} />
        </div>

        <div className="review-modal__section">
          <span className="review-modal__label">{t('games.reviewLabel')}</span>
          <textarea
            className="review-modal__textarea"
            placeholder={t('games.reviewPlaceholder')}
            value={review}
            rows={3}
            onChange={e => {
              setReview(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = `${e.target.scrollHeight}px`
            }}
          />
        </div>

        <div className="review-modal__actions">
          <button className="review-modal__cancel" onClick={onCancel} disabled={loading}>
            {t('confirm.cancel')}
          </button>
          <button
            className="review-modal__submit"
            onClick={() => onConfirm(rating, review)}
            disabled={loading}
          >
            {loading ? '...' : t('games.markConfirm')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Delete confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({
  gameTitle,
  onConfirm,
  onCancel,
}: {
  gameTitle: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const { t } = useLang()

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div
      className="review-backdrop"
      onClick={e => { e.stopPropagation(); if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="delete-confirm" onClick={e => e.stopPropagation()}>
        <h3 className="delete-confirm__title">{t('games.deleteTitle')}</h3>
        <p className="delete-confirm__movie">{gameTitle}</p>
        <p
          className="delete-confirm__warning"
          dangerouslySetInnerHTML={{ __html: t('games.deleteWarning') }}
        />
        <div className="delete-confirm__actions">
          <button className="review-modal__cancel" onClick={onCancel}>
            {t('confirm.cancel')}
          </button>
          <button className="delete-confirm__btn" onClick={onConfirm}>
            {t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── User play card ────────────────────────────────────────────────────────────

function UserPlayCard({
  status,
  isMe,
  onToggle,
}: {
  status: GameUserStatus
  isMe: boolean
  onToggle: () => void
}) {
  return (
    <div className="mdc-user-card" onClick={e => e.stopPropagation()}>
      <button
        className={`mdc-user-card__check${isMe ? ' mdc-user-card__check--mine' : ''}`}
        onClick={isMe ? onToggle : undefined}
        disabled={!isMe}
        aria-label="played"
      >✓</button>
      <div className="mdc-user-card__body">
        <div className="mdc-user-card__top">
          <span className="mdc-user-card__name">{status.username}</span>
          {status.rating != null && (
            <span className="mdc-user-card__rating">{status.rating}/10</span>
          )}
        </div>
        {status.review && (
          <p className="mdc-user-card__review">{status.review}</p>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  game: Game
  canEdit: boolean
  onDelete: (id: number) => void
  onPlayUpdated: (updated: Game) => void
}

export default function GameCard({ game, canEdit, onDelete, onPlayUpdated }: Props) {
  const { t } = useLang()
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailClosing, setDetailClosing] = useState(false)
  const [detail, setDetail] = useState<GameDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const src = posterSrc(game.poster)
  const isObserver = getRole() === 'observer'
  const currentUsername = getUsername()
  const isAllPlayed = game.user_count > 0 && game.play_count === game.user_count

  function openDetail() {
    setDetailOpen(true)
    setDetailClosing(false)
    setLoadingDetail(true)
    fetchGameDetail(game.id)
      .then(d => setDetail(d))
      .catch(console.error)
      .finally(() => setLoadingDetail(false))
  }

  function closeDetail() {
    setDetailClosing(true)
    setReviewOpen(false)
    setDeleteConfirmOpen(false)
  }

  function handleAnimationEnd(e: React.AnimationEvent) {
    if (e.animationName === 'modal-out') {
      setDetailOpen(false)
      setDetailClosing(false)
    }
  }

  useEffect(() => {
    if (!detailOpen || reviewOpen || deleteConfirmOpen) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') closeDetail() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [detailOpen, reviewOpen, deleteConfirmOpen])

  function applyToggleResult(d: GameDetail) {
    setDetail(d)
    const play_count = d.statuses.filter(s => s.is_played).length
    const user_count = d.statuses.length
    const myStatus = d.statuses.find(s => s.username === currentUsername)
    onPlayUpdated({ ...game, play_count, user_count, is_played_by_me: myStatus?.is_played ?? false })
  }

  function handleUnplay() {
    if (isObserver || toggling) return
    setToggling(true)
    toggleUserPlayed(game.id)
      .then(applyToggleResult)
      .catch(console.error)
      .finally(() => setToggling(false))
  }

  function handleConfirmPlay(rating: number | null, review: string) {
    if (isObserver || toggling) return
    setToggling(true)
    toggleUserPlayed(game.id, { rating, review: review.trim() || null })
      .then(d => { applyToggleResult(d); setReviewOpen(false) })
      .catch(console.error)
      .finally(() => setToggling(false))
  }

  const playedStatuses = detail?.statuses.filter(s => s.is_played) ?? []
  const myStatus = detail?.statuses.find(s => s.username === currentUsername)
  const iMePlayed = myStatus?.is_played ?? false

  return (
    <div className={`game-card${game.is_played_by_me ? ' game-card--played' : ''}`}>
      <div
        className="game-card__img-wrap"
        onClick={openDetail}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && openDetail()}
      >
        {src
          ? <img src={src} alt={game.title} className="game-card__img" />
          : <div className="game-card__no-poster">{game.title[0]}</div>
        }
        {game.user_count > 0 && (
          <div className={`movie-card__badge${isAllPlayed ? ' movie-card__badge--done' : ''}`}>
            {game.play_count}/{game.user_count}
          </div>
        )}
      </div>

      <p className="game-card__title">{game.title}</p>

      {detailOpen && (
        <div
          className={`gd-backdrop${detailClosing ? ' gd-backdrop--closing' : ''}`}
          onClick={closeDetail}
          onAnimationEnd={handleAnimationEnd}
        >
          <div className="gd-modal">
            <button className="gd-modal__close" onClick={closeDetail}>×</button>

            {/* ── Left ── */}
            <div className="gd-modal__left">
              <div className="gd-modal__header">
                <div className="gd-modal__header-row">
                  <h2 className="gd-modal__title">{game.title}</h2>
                  <div className="gd-modal__header-btns">
                    {game.steam_link && (
                      <a
                        className="gd-modal__link-btn"
                        href={game.steam_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        title="Steam"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    )}
                    {canEdit && (
                      <button
                        className="gd-modal__delete-btn"
                        onClick={e => { e.stopPropagation(); setDeleteConfirmOpen(true) }}
                        title={t('common.delete')}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4h6v2" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <span className="movie-detail__subtitle">
                  {t('games.playedBy')}
                  {detail && (
                    <span className="movie-detail__count">
                      {' '}{playedStatuses.length}/{detail.statuses.length}
                    </span>
                  )}
                </span>
              </div>

              {loadingDetail ? (
                <div className="loading-spinner" />
              ) : detail && (
                <div className="movie-detail__scroll">
                  {!isObserver && !iMePlayed && (
                    <button
                      className="mdc-add-btn"
                      onClick={e => { e.stopPropagation(); setReviewOpen(true) }}
                      disabled={toggling}
                    >
                      + {t('games.markPlayed')}
                    </button>
                  )}
                  {playedStatuses.length === 0 && (isObserver || iMePlayed) && (
                    <p className="movie-detail__empty">{t('common.empty')}</p>
                  )}
                  {playedStatuses.map(s => (
                    <UserPlayCard
                      key={s.user_id}
                      status={s}
                      isMe={s.username === currentUsername && !isObserver}
                      onToggle={handleUnplay}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Right: poster ── */}
            <div className="gd-modal__right" onClick={e => e.stopPropagation()}>
              {src
                ? <img src={src} alt={game.title} className="gd-modal__poster" />
                : <div className="gd-modal__no-poster">{game.title[0]}</div>
              }
            </div>
          </div>

          {reviewOpen && (
            <ReviewModal
              gameTitle={game.title}
              onConfirm={handleConfirmPlay}
              onCancel={() => setReviewOpen(false)}
              loading={toggling}
            />
          )}

          {deleteConfirmOpen && (
            <DeleteConfirm
              gameTitle={game.title}
              onConfirm={() => { setDetailOpen(false); onDelete(game.id) }}
              onCancel={() => setDeleteConfirmOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  )
}
