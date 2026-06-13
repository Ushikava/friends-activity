import { useState, useEffect } from 'react'
import { fetchMovieDetail, toggleUserWatched } from '../../api/movies'
import { getRole, getUsername } from '../../api/auth'
import { useLang } from '../../i18n/LangContext'
import type { Movie, MovieDetail, MovieUserStatus } from '../../types'
import './MovieCard.css'

const UPLOADS = import.meta.env.VITE_UPLOADS_URL

function posterSrc(poster: string | null | undefined): string | null {
  if (!poster) return null
  if (poster.startsWith('http')) return poster
  return `${UPLOADS}/${poster}`
}

// ── Star rating (1-10) ────────────────────────────────────────────────────────

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
        >
          ★
        </button>
      ))}
      {value !== null && (
        <span className="star-rating__value">{value}/10</span>
      )}
    </div>
  )
}

// ── Review modal ──────────────────────────────────────────────────────────────

interface ReviewModalProps {
  movieTitle: string
  onConfirm: (rating: number | null, review: string) => void
  onCancel: () => void
  loading: boolean
}

function ReviewModal({ movieTitle, onConfirm, onCancel, loading }: ReviewModalProps) {
  const { t } = useLang()
  const [rating, setRating] = useState<number | null>(null)
  const [review, setReview] = useState('')

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div
      className="review-backdrop"
      onClick={e => { e.stopPropagation(); if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="review-modal" onClick={e => e.stopPropagation()}>
        <h3 className="review-modal__title">{t('movies.rateTitle')}</h3>
        <p className="review-modal__movie">{movieTitle}</p>

        <div className="review-modal__section">
          <span className="review-modal__label">{t('movies.ratingLabel')}</span>
          <StarRating value={rating} onChange={setRating} />
        </div>

        <div className="review-modal__section">
          <span className="review-modal__label">{t('movies.reviewLabel')}</span>
          <textarea
            className="review-modal__textarea"
            placeholder={t('movies.reviewPlaceholder')}
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
            {loading ? '...' : t('movies.markConfirm')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Delete confirm dialog ─────────────────────────────────────────────────────

function DeleteConfirm({
  movieTitle,
  onConfirm,
  onCancel,
}: {
  movieTitle: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const { t } = useLang()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div
      className="review-backdrop"
      onClick={e => { e.stopPropagation(); if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="delete-confirm" onClick={e => e.stopPropagation()}>
        <h3 className="delete-confirm__title">{t('movies.deleteTitle')}</h3>
        <p className="delete-confirm__movie">{movieTitle}</p>
        <p
          className="delete-confirm__warning"
          dangerouslySetInnerHTML={{ __html: t('movies.deleteWarning') }}
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

// ── User watch card ───────────────────────────────────────────────────────────

function UserWatchCard({
  status,
  isMe,
  onToggle,
}: {
  status: MovieUserStatus
  isMe: boolean
  onToggle: () => void
}) {
  return (
    <div className="mdc-user-card" onClick={e => e.stopPropagation()}>
      <button
        className={`mdc-user-card__check${isMe ? ' mdc-user-card__check--mine' : ''}`}
        onClick={isMe ? onToggle : undefined}
        disabled={!isMe}
        aria-label="watched"
      >
        ✓
      </button>
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
  movie: Movie
  canEdit: boolean
  onDelete: (id: number) => void
  onWatchUpdated: (updated: Movie) => void
}

export default function MovieCard({ movie, canEdit, onDelete, onWatchUpdated }: Props) {
  const { t } = useLang()
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailClosing, setDetailClosing] = useState(false)
  const [detail, setDetail] = useState<MovieDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const src = posterSrc(movie.poster)
  const isObserver = getRole() === 'observer'
  const currentUsername = getUsername()
  const isAllWatched = movie.is_watched_by_me

  function openDetail() {
    setDetailOpen(true)
    setDetailClosing(false)
    setLoadingDetail(true)
    fetchMovieDetail(movie.id)
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
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDetail()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [detailOpen, reviewOpen, deleteConfirmOpen])

  function applyToggleResult(d: MovieDetail) {
    setDetail(d)
    const watch_count = d.statuses.filter(s => s.is_watched).length
    const user_count = d.statuses.length
    const myStatus = d.statuses.find(s => s.username === currentUsername)
    onWatchUpdated({ ...movie, watch_count, user_count, is_watched_by_me: myStatus?.is_watched ?? false })
  }

  function handleUnwatch() {
    if (isObserver || toggling) return
    setToggling(true)
    toggleUserWatched(movie.id)
      .then(applyToggleResult)
      .catch(console.error)
      .finally(() => setToggling(false))
  }

  function handleConfirmWatch(rating: number | null, review: string) {
    if (isObserver || toggling) return
    setToggling(true)
    toggleUserWatched(movie.id, { rating, review: review.trim() || null })
      .then(d => { applyToggleResult(d); setReviewOpen(false) })
      .catch(console.error)
      .finally(() => setToggling(false))
  }

  function handleDeleteConfirmed() {
    setDetailOpen(false)
    onDelete(movie.id)
  }

  const watchedStatuses = detail?.statuses.filter(s => s.is_watched) ?? []
  const myStatus = detail?.statuses.find(s => s.username === currentUsername)
  const iMeWatched = myStatus?.is_watched ?? false

  function handleTilt(e: React.MouseEvent<HTMLDivElement>) {
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    const rotateY = (x - 0.5) * 22
    const rotateX = (0.5 - y) * 22
    el.style.transition = 'transform 0.07s ease-out'
    el.style.transform = `perspective(500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.07)`
  }

  function handleTiltReset(e: React.MouseEvent<HTMLDivElement>) {
    const el = e.currentTarget
    el.style.transition = 'transform 0.45s ease-out'
    el.style.transform = ''
  }

  return (
    <div className={`movie-card${isAllWatched ? ' movie-card--all-watched' : ''}`}>
      <div
        className="movie-card__tilt"
        onClick={openDetail}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && openDetail()}
        onMouseMove={handleTilt}
        onMouseLeave={handleTiltReset}
      >
        <div className="movie-card__img-wrap">
          {src
            ? <img src={src} alt={movie.title} className="movie-card__img" />
            : <div className="movie-card__no-poster">{movie.title[0]}</div>
          }
          {movie.user_count > 0 && (
            <div className={`movie-card__badge${isAllWatched ? ' movie-card__badge--done' : ''}`}>
              {movie.watch_count}/{movie.user_count}
            </div>
          )}
        </div>
      </div>

      <p className="movie-card__title">{movie.title}</p>

      {detailOpen && (
        <div
          className={`movie-detail-backdrop${detailClosing ? ' movie-detail-backdrop--closing' : ''}`}
          onClick={closeDetail}
          onAnimationEnd={handleAnimationEnd}
        >
          <div className="movie-detail">
            <button className="movie-detail__close" onClick={closeDetail}>×</button>

            {/* ── Left: title + floating user cards ── */}
            <div className="movie-detail__left">
              <div className="movie-detail__header">
                <div className="movie-detail__header-row">
                  <h2 className="movie-detail__title">{movie.title}</h2>
                  {canEdit && (
                    <button
                      className="movie-detail__delete-btn"
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
                <span className="movie-detail__subtitle">
                  {t('movies.watchedBy')}
                  {detail && (
                    <span className="movie-detail__count">
                      {' '}{watchedStatuses.length}/{detail.statuses.length}
                    </span>
                  )}
                </span>
              </div>

              {loadingDetail ? (
                <div className="loading-spinner" />
              ) : detail && (
                <div className="movie-detail__scroll">
                  {!isObserver && !iMeWatched && (
                    <button
                      className="mdc-add-btn"
                      onClick={e => { e.stopPropagation(); setReviewOpen(true) }}
                      disabled={toggling}
                    >
                      + {t('movies.markWatched')}
                    </button>
                  )}
                  {watchedStatuses.length === 0 && (isObserver || iMeWatched) && (
                    <p className="movie-detail__empty">{t('common.empty')}</p>
                  )}
                  {watchedStatuses.map(s => (
                    <UserWatchCard
                      key={s.user_id}
                      status={s}
                      isMe={s.username === currentUsername && !isObserver}
                      onToggle={handleUnwatch}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Right: poster ── */}
            <div className="movie-detail__right" onClick={e => e.stopPropagation()}>
              {src
                ? <img src={src} alt={movie.title} className="movie-detail__poster" />
                : <div className="movie-detail__no-poster">{movie.title[0]}</div>
              }
            </div>
          </div>

          {reviewOpen && (
            <ReviewModal
              movieTitle={movie.title}
              onConfirm={handleConfirmWatch}
              onCancel={() => setReviewOpen(false)}
              loading={toggling}
            />
          )}

          {deleteConfirmOpen && (
            <DeleteConfirm
              movieTitle={movie.title}
              onConfirm={handleDeleteConfirmed}
              onCancel={() => setDeleteConfirmOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  )
}
