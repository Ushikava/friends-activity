import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import NavBar from '../../components/NavBar/NavBar'
import GameCard from '../../components/GameCard/GameCard'
import AddModal from '../../components/MediaGrid/AddModal'
import Pagination from '../../components/Pagination/Pagination'
import { fetchGames, addGame, deleteGame } from '../../api/games'
import { getRole } from '../../api/auth'
import { useLang } from '../../i18n/LangContext'
import { containerVariants, cardVariants } from '../../utils/animations'
import type { Game } from '../../types'
import '../page.css'
import '../../components/MediaGrid/mediaGrid.css'

const PAGE_SIZE = 20

export default function Games() {
  const { t } = useLang()
  const [games, setGames] = useState<Game[]>([])
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
    fetchGames(page, PAGE_SIZE)
      .then(data => { setGames(data.items); setTotal(data.total) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page])

  function handlePlayUpdated(updated: Game) {
    setGames(p => p.map(g => g.id === updated.id ? updated : g))
  }

  function handleDelete(id: number) {
    const isLastOnPage = games.length === 1 && page > 1
    deleteGame(id)
      .then(() => {
        setGames(p => p.filter(g => g.id !== id))
        setTotal(n => n - 1)
        if (isLastOnPage) setPage(p => p - 1)
      })
      .catch(() => showErr(t('common.errDeleteFail')))
  }

  async function handleAdd(title: string, file: File | null, _url: null, extras: Record<string, string>) {
    const game = await addGame(title, file, null, extras.steam_link || null)
    if (page === 1) {
      setGames(p => [game, ...p.slice(0, PAGE_SIZE - 1)])
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
          <h1 className="media-header__title">{t('games.title')}</h1>
          {canEdit && (
            <button className="media-header__add" onClick={() => setShowModal(true)}>+</button>
          )}
        </div>

        {loading
          ? <div className="loading-spinner" />
          : games.length === 0
          ? <p className="media-empty">{t('common.empty')}</p>
          : (
            <motion.div
              className="media-grid"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {games.map(g => (
                <motion.div key={g.id} variants={cardVariants}>
                  <GameCard
                    game={g}
                    canEdit={canEdit}
                    onDelete={handleDelete}
                    onPlayUpdated={handlePlayUpdated}
                  />
                </motion.div>
              ))}
            </motion.div>
          )
        }

        <Pagination page={page} total={total} limit={PAGE_SIZE} onChange={setPage} />

        {showModal && (
          <AddModal
            title={t('games.add')}
            onClose={() => setShowModal(false)}
            onSubmit={handleAdd}
            extraFields={[{ name: 'steam_link', placeholder: t('games.steamLink') }]}
          />
        )}
      </main>
    </div>
  )
}
