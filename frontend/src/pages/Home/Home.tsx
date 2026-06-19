import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import NavBar from '../../components/NavBar/NavBar'
import MovieCard from '../../components/MovieCard/MovieCard'
import GameCard from '../../components/GameCard/GameCard'
import Lightbox from '../../components/Lightbox/Lightbox'
import { fetchPhotos, photoSrc } from '../../api/photos'
import { fetchPlaces, placeSrc } from '../../api/places'
import { fetchMovies } from '../../api/movies'
import { fetchGames } from '../../api/games'
import { fetchActivity, fetchStats, fetchFeed } from '../../api/activity'
import { useLang } from '../../i18n/LangContext'
import { containerVariants, statVariants, sectionVariants } from '../../utils/animations'
import ActivityGrid from '../../components/ActivityGrid/ActivityGrid'
import ActivityFeed from '../../components/ActivityFeed/ActivityFeed'
import type { Photo, Place, Movie, Game, Stats, ActivityData, FeedEvent } from '../../types'
import '../page.css'
import '../../components/MediaGrid/mediaGrid.css'
import './Home.css'

const PHOTO_LIMIT = 2
const MEDIA_LIMIT = 6

const CIRCLE_R = 40
const CIRCLE_SW = 5
const CIRCLE_SIZE = (CIRCLE_R + CIRCLE_SW) * 2
const CIRCLE_C = 2 * Math.PI * CIRCLE_R

interface NumberStatProps {
  value: number
  label: string
}

function NumberStat({ value, label }: NumberStatProps) {
  return (
    <motion.div className="home-stat" variants={statVariants}>
      <span className="home-stat__big">{value}</span>
      <span className="home-stat__label">{label}</span>
    </motion.div>
  )
}

interface CircleStatProps {
  done: number
  total: number
  label: string
}

function CircleStat({ done, total, label }: CircleStatProps) {
  const progress = total > 0 ? done / total : 0
  const offset = CIRCLE_C * (1 - progress)
  const cx = CIRCLE_R + CIRCLE_SW
  return (
    <motion.div className="home-stat" variants={statVariants}>
      <div className="home-stat__ring-wrap">
        <svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={cx} cy={cx} r={CIRCLE_R} fill="none" stroke="#b0b0b0" strokeWidth={CIRCLE_SW} />
          {done > 0 && (
            <circle
              cx={cx} cy={cx} r={CIRCLE_R}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={CIRCLE_SW}
              strokeLinecap="round"
              strokeDasharray={CIRCLE_C}
              strokeDashoffset={offset}
            />
          )}
        </svg>
        <div className="home-stat__ring-label">
          <strong>{done}</strong><span>/{total}</span>
        </div>
      </div>
      <span className="home-stat__label">{label}</span>
    </motion.div>
  )
}

function getTodayDate(lang: string): string {
  return new Date().toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function Home() {
  const { t, lang } = useLang()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [places, setPlaces] = useState<Place[]>([])
  const [movies, setMovies] = useState<Movie[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [activity, setActivity] = useState<ActivityData>({})
  const [feed, setFeed] = useState<FeedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<{ src: string; description?: string; createdAt: string } | null>(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const movieId = searchParams.get('movie')
    const gameId = searchParams.get('game')
    if (movieId) { navigate(`/movies?movie=${movieId}`, { replace: true }); return }
    if (gameId)  { navigate(`/games?game=${gameId}`,   { replace: true }); return }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    Promise.allSettled([
      fetchStats().then(setStats),
      fetchPhotos(1, PHOTO_LIMIT).then(d => setPhotos(d.items)),
      fetchPlaces(1, PHOTO_LIMIT).then(d => setPlaces(d.items)),
      fetchMovies(1, MEDIA_LIMIT).then(d => setMovies(d.items)),
      fetchGames(1, MEDIA_LIMIT).then(d => setGames(d.items)),
      fetchActivity().then(setActivity),
      fetchFeed().then(setFeed).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  function handleMovieWatchUpdated(updated: Movie) {
    setMovies(p => p.map(m => m.id === updated.id ? updated : m))
  }

  function handleGamePlayUpdated(updated: Game) {
    setGames(p => p.map(g => g.id === updated.id ? updated : g))
  }

  const isEmpty = !stats || (stats.photos === 0 && stats.places === 0 && stats.movies.total === 0 && stats.games.total === 0)

  return (
    <div className="page">
      <NavBar />
      <main className="page__main">

        <div className="home-statusbar">
          <span className="home-statusbar__title">{t('home.title')}</span>
          <span className="home-statusbar__date">{getTodayDate(lang)}</span>
        </div>

        {loading
          ? <div className="loading-spinner" />
          : isEmpty && <p className="media-empty">{t('common.empty')}</p>
        }

        {!loading && (
          <motion.div
            className="home-row"
            variants={sectionVariants}
            initial="hidden"
            animate="show"
          >
            <div className="home-col">
              <ActivityGrid activity={activity} />
            </div>
            <div className="home-col">
              <h2 className="home-section__title" style={{ marginBottom: 12 }}>{t('home.stats')}</h2>
              <motion.div
                className="home-stats"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                <NumberStat value={stats?.photos ?? 0}  label={t('home.stat.screenshots')} />
                <NumberStat value={stats?.places ?? 0}  label={t('home.stat.photos')} />
                <CircleStat
                  done={stats?.movies.watched ?? 0}
                  total={stats?.movies.total ?? 0}
                  label={t('home.stat.movies')}
                />
                <CircleStat
                  done={stats?.games.played ?? 0}
                  total={stats?.games.total ?? 0}
                  label={t('home.stat.games')}
                />
              </motion.div>
            </div>
          </motion.div>
        )}

        {!loading && (photos.length > 0 || places.length > 0) && (
          <motion.div
            className="home-row"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.48, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
          >
            {photos.length > 0 && (
              <section className="home-col">
                <div className="home-section__header">
                  <h2 className="home-section__title">{t('home.gallery')}</h2>
                  {(stats?.photos ?? 0) > PHOTO_LIMIT && (
                    <button className="home-section__more" onClick={() => navigate('/gallery')}>
                      {t('common.showMore')}
                    </button>
                  )}
                </div>
                <div className="home-photos">
                  {photos.map(photo => (
                    <div
                      key={photo.id}
                      className="home-photo"
                      onClick={() => setLightbox({ src: photoSrc(photo.filename) ?? '', description: photo.description ?? undefined, createdAt: photo.uploaded_at })}
                    >
                      <img src={photoSrc(photo.filename) ?? undefined} alt={photo.description || ''} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {places.length > 0 && (
              <section className="home-col">
                <div className="home-section__header">
                  <h2 className="home-section__title">{t('home.places')}</h2>
                  {(stats?.places ?? 0) > PHOTO_LIMIT && (
                    <button className="home-section__more" onClick={() => navigate('/places')}>
                      {t('common.showMore')}
                    </button>
                  )}
                </div>
                <div className="home-photos">
                  {places.map(place => (
                    <div
                      key={place.id}
                      className="home-photo"
                      onClick={() => setLightbox({ src: placeSrc(place.filename) ?? '', description: place.description ?? undefined, createdAt: place.uploaded_at })}
                    >
                      <img src={placeSrc(place.filename) ?? undefined} alt={place.description || ''} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        )}

        {!loading && (movies.length > 0 || games.length > 0) && (
          <motion.div
            className="home-row"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.48, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
          >
            {movies.length > 0 && (
              <section className="home-col">
                <div className="home-section__header">
                  <h2 className="home-section__title">{t('home.movies')}</h2>
                  {(stats?.movies.total ?? 0) > MEDIA_LIMIT && (
                    <button className="home-section__more" onClick={() => navigate('/movies')}>
                      {t('common.showMore')}
                    </button>
                  )}
                </div>
                <div className="media-grid">
                  {movies.map(m => (
                    <MovieCard
                      key={m.id}
                      movie={m}
                      canEdit={false}
                      onDelete={() => {}}
                      onWatchUpdated={handleMovieWatchUpdated}
                    />
                  ))}
                </div>
              </section>
            )}

            {games.length > 0 && (
              <section className="home-col">
                <div className="home-section__header">
                  <h2 className="home-section__title">{t('home.games')}</h2>
                  {(stats?.games.total ?? 0) > MEDIA_LIMIT && (
                    <button className="home-section__more" onClick={() => navigate('/games')}>
                      {t('common.showMore')}
                    </button>
                  )}
                </div>
                <div className="media-grid">
                  {games.map(g => (
                    <GameCard
                      key={g.id}
                      game={g}
                      canEdit={false}
                      onPlayUpdated={handleGamePlayUpdated}
                      onDelete={() => {}}
                    />
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        )}

        {!loading && (
          <motion.div
            className="home-row"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.48, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.45 }}
          >
            <div className="home-col home-col--full">
              <ActivityFeed events={feed} />
            </div>
          </motion.div>
        )}

      </main>

      {lightbox && (
        <Lightbox
          src={lightbox.src}
          description={lightbox.description}
          createdAt={lightbox.createdAt}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}
