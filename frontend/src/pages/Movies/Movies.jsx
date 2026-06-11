import { useState, useEffect } from 'react'
import NavBar from '../../components/NavBar/NavBar'
import MediaGrid from '../../components/MediaGrid/MediaGrid'
import { fetchMovies, addMovie, toggleWatched, deleteMovie } from '../../api/movies'
import { getRole } from '../../api/auth'
import '../page.css'

export default function Movies() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const canEdit = getRole() !== 'observer'

  useEffect(() => {
    fetchMovies().then(setMovies).catch(console.error).finally(() => setLoading(false))
  }, [])

  return (
    <div className="page">
      <NavBar />
      <main className="page__main">
        <MediaGrid
          pageTitle="Фильмы / Сериалы"
          modalTitle="Добавить фильм"
          items={movies}
          loading={loading}
          checkedField="is_watched"
          checkLabel="Просмотрено"
          canEdit={canEdit}
          onToggle={id =>
            toggleWatched(id).then(u => setMovies(p => p.map(m => m.id === id ? u : m)))
          }
          onDelete={id =>
            deleteMovie(id).then(() => setMovies(p => p.filter(m => m.id !== id)))
          }
          onAdd={(title, file, url) => addMovie(title, file, url)}
          onItemAdded={m => setMovies(p => [m, ...p])}
        />
      </main>
    </div>
  )
}
