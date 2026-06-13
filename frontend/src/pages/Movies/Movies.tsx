import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import NavBar from '../../components/NavBar/NavBar'
import MovieCard from '../../components/MovieCard/MovieCard'
import AddModal from '../../components/MediaGrid/AddModal'
import Pagination from '../../components/Pagination/Pagination'
import { fetchMovies, addMovie, deleteMovie } from '../../api/movies'
import { getRole } from '../../api/auth'
import { useLang } from '../../i18n/LangContext'
import { containerVariants, cardVariants } from '../../utils/animations'
import type { Movie } from '../../types'
import '../page.css'
import '../../components/MediaGrid/mediaGrid.css'

const PAGE_SIZE = 20

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

  async function handleAdd(title: string, file: File | null, _url: null) {
    const movie = await addMovie(title, file, null)
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
          <AddModal
            title={t('movies.add')}
            onClose={() => setShowModal(false)}
            onSubmit={handleAdd}
          />
        )}
      </main>
    </div>
  )
}
