import { useState, useEffect } from 'react'
import NavBar from '../../components/NavBar/NavBar'
import MediaGrid from '../../components/MediaGrid/MediaGrid'
import Pagination from '../../components/Pagination/Pagination'
import { fetchMovies, addMovie, toggleWatched, deleteMovie } from '../../api/movies'
import { getRole } from '../../api/auth'
import { useLang } from '../../i18n/LangContext'
import '../page.css'

const PAGE_SIZE = 20

export default function Movies() {
  const { t } = useLang()
  const [movies, setMovies] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const canEdit = getRole() !== 'observer'

  useEffect(() => {
    setLoading(true)
    fetchMovies(page, PAGE_SIZE)
      .then(data => { setMovies(data.items); setTotal(data.total) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page])

  function handleToggle(id) {
    toggleWatched(id).then(u => setMovies(p => p.map(m => m.id === id ? u : m)))
  }

  function handleDelete(id) {
    const isLastOnPage = movies.length === 1 && page > 1
    deleteMovie(id).then(() => {
      setMovies(p => p.filter(m => m.id !== id))
      setTotal(n => n - 1)
      if (isLastOnPage) setPage(p => p - 1)
    })
  }

  function handleItemAdded(movie) {
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
        <MediaGrid
          pageTitle={t('movies.title')}
          modalTitle={t('movies.add')}
          items={movies}
          loading={loading}
          checkedField="is_watched"
          checkLabel={t('movies.watched')}
          canEdit={canEdit}
          onToggle={handleToggle}
          onDelete={handleDelete}
          onAdd={(title, file, url) => addMovie(title, file, url)}
          onItemAdded={handleItemAdded}
        />
        <Pagination page={page} total={total} limit={PAGE_SIZE} onChange={setPage} />
      </main>
    </div>
  )
}
