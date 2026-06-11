import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import NavBar from '../../components/NavBar/NavBar'
import MediaCard from '../../components/MediaGrid/MediaCard'
import { fetchPhotos, photoSrc } from '../../api/photos'
import { fetchPlaces, placeSrc } from '../../api/places'
import { fetchMovies, toggleWatched } from '../../api/movies'
import { fetchGames, togglePlayed } from '../../api/games'
import '../page.css'
import '../../components/MediaGrid/mediaGrid.css'
import './Home.css'

const PHOTO_LIMIT = 4
const MEDIA_LIMIT = 6

export default function Home() {
  const [photos, setPhotos] = useState([])
  const [places, setPlaces] = useState([])
  const [movies, setMovies] = useState([])
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.allSettled([
      fetchPhotos().then(setPhotos),
      fetchPlaces().then(setPlaces),
      fetchMovies().then(setMovies),
      fetchGames().then(setGames),
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

  const isEmpty = photos.length === 0 && places.length === 0 && movies.length === 0 && games.length === 0

  return (
    <div className="page">
      <NavBar />
      <main className="page__main">

        {loading
          ? <div className="loading-spinner" />
          : isEmpty && <p className="media-empty">Пока ничего нет</p>
        }

        {photos.length > 0 && (
          <section className="home-section">
            <div className="home-section__header">
              <h2 className="home-section__title">Галерея</h2>
              {photos.length > PHOTO_LIMIT && (
                <button className="home-section__more" onClick={() => navigate('/gallery')}>
                  Показать больше →
                </button>
              )}
            </div>
            <div className="home-photos">
              {photos.slice(0, PHOTO_LIMIT).map(photo => (
                <div
                  key={photo.id}
                  className="home-photo"
                  onClick={() => navigate('/gallery')}
                >
                  <img
                    src={photoSrc(photo.filename)}
                    alt={photo.description || ''}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {places.length > 0 && (
          <section className="home-section">
            <div className="home-section__header">
              <h2 className="home-section__title">Места</h2>
              {places.length > PHOTO_LIMIT && (
                <button className="home-section__more" onClick={() => navigate('/places')}>
                  Показать больше →
                </button>
              )}
            </div>
            <div className="home-photos">
              {places.slice(0, PHOTO_LIMIT).map(place => (
                <div
                  key={place.id}
                  className="home-photo"
                  onClick={() => navigate('/places')}
                >
                  <img
                    src={placeSrc(place.filename)}
                    alt={place.description || ''}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {movies.length > 0 && (
          <section className="home-section">
            <div className="home-section__header">
              <h2 className="home-section__title">Фильмы / Сериалы</h2>
              {movies.length > MEDIA_LIMIT && (
                <button className="home-section__more" onClick={() => navigate('/movies')}>
                  Показать больше →
                </button>
              )}
            </div>
            <div className="media-grid">
              {movies.slice(0, MEDIA_LIMIT).map(m => (
                <MediaCard
                  key={m.id}
                  item={m}
                  checkedField="is_watched"
                  checkLabel="Просмотрено"
                  canEdit={false}
                  onToggle={handleToggleMovie}
                  onDelete={() => {}}
                />
              ))}
            </div>
          </section>
        )}

        {games.length > 0 && (
          <section className="home-section">
            <div className="home-section__header">
              <h2 className="home-section__title">Игры</h2>
              {games.length > MEDIA_LIMIT && (
                <button className="home-section__more" onClick={() => navigate('/games')}>
                  Показать больше →
                </button>
              )}
            </div>
            <div className="media-grid">
              {games.slice(0, MEDIA_LIMIT).map(g => (
                <MediaCard
                  key={g.id}
                  item={g}
                  checkedField="is_played"
                  checkLabel="Пройдено"
                  linkField="steam_link"
                  canEdit={false}
                  onToggle={handleToggleGame}
                  onDelete={() => {}}
                />
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  )
}
