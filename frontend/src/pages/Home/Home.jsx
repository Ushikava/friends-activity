import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import NavBar from '../../components/NavBar/NavBar'
import MediaCard from '../../components/MediaGrid/MediaCard'
import { fetchPhotos, photoSrc } from '../../api/photos'
import { fetchPlaces, placeSrc } from '../../api/places'
import { fetchMovies, toggleWatched } from '../../api/movies'
import { fetchGames, togglePlayed } from '../../api/games'
import { getRole } from '../../api/auth'
import { fetchActivity, fetchStats } from '../../api/activity'
import { useLang } from '../../i18n/LangContext'
import ActivityGrid from '../../components/ActivityGrid/ActivityGrid'
import '../page.css'
import '../../components/MediaGrid/mediaGrid.css'
import './Home.css'

const PHOTO_LIMIT = 2
const MEDIA_LIMIT = 5

const CIRCLE_R = 40
const CIRCLE_SW = 5
const CIRCLE_SIZE = (CIRCLE_R + CIRCLE_SW) * 2
const CIRCLE_C = 2 * Math.PI * CIRCLE_R

function NumberStat({ value, label }) {
  return (
    <div className="home-stat">
      <span className="home-stat__big">{value}</span>
      <span className="home-stat__label">{label}</span>
    </div>
  )
}

function CircleStat({ done, total, label }) {
  const progress = total > 0 ? done / total : 0
  const offset = CIRCLE_C * (1 - progress)
  const cx = CIRCLE_R + CIRCLE_SW
  return (
    <div className="home-stat">
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
    </div>
  )
}

function getTodayDate(lang) {
  return new Date().toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function Home() {
  const { t, lang } = useLang()
  const [photos, setPhotos] = useState([])
  const [places, setPlaces] = useState([])
  const [movies, setMovies] = useState([])
  const [games, setGames] = useState([])
  const [stats, setStats] = useState(null)
  const [activity, setActivity] = useState({})
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const canEdit = getRole() !== 'observer'

  useEffect(() => {
    Promise.allSettled([
      fetchStats().then(setStats),
      fetchPhotos(1, PHOTO_LIMIT).then(d => setPhotos(d.items)),
      fetchPlaces(1, PHOTO_LIMIT).then(d => setPlaces(d.items)),
      fetchMovies(1, MEDIA_LIMIT).then(d => setMovies(d.items)),
      fetchGames(1, MEDIA_LIMIT).then(d => setGames(d.items)),
      fetchActivity().then(setActivity),
    ]).finally(() => setLoading(false))
  }, [])

  function handleToggleMovie(id) {
    toggleWatched(id)
      .then(u => setMovies(p => p.map(m => m.id === id ? u : m)))
      .catch(console.error)
  }

  function handleToggleGame(id) {
    togglePlayed(id)
      .then(u => setGames(p => p.map(g => g.id === id ? u : g)))
      .catch(console.error)
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
          <div className="home-row">
            <div className="home-col">
              <ActivityGrid activity={activity} />
            </div>
            <div className="home-col">
              <h2 className="home-section__title" style={{ marginBottom: 12 }}>{t('home.stats')}</h2>
              <div className="home-stats">
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
              </div>
            </div>
          </div>
        )}

        {!loading && (photos.length > 0 || places.length > 0) && (
          <div className="home-row">
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
                    <div key={photo.id} className="home-photo" onClick={() => navigate('/gallery')}>
                      <img src={photoSrc(photo.filename)} alt={photo.description || ''} />
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
                    <div key={place.id} className="home-photo" onClick={() => navigate('/places')}>
                      <img src={placeSrc(place.filename)} alt={place.description || ''} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {!loading && (movies.length > 0 || games.length > 0) && (
          <div className="home-row">
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
                    <MediaCard
                      key={m.id}
                      item={m}
                      checkedField="is_watched"
                      checkLabel={t('movies.watched')}
                      canEdit={canEdit}
                      onToggle={handleToggleMovie}
                      onDelete={() => {}}
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
                    <MediaCard
                      key={g.id}
                      item={g}
                      checkedField="is_played"
                      checkLabel={t('games.played')}
                      linkField="steam_link"
                      canEdit={canEdit}
                      onToggle={handleToggleGame}
                      onDelete={() => {}}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

      </main>
    </div>
  )
}
