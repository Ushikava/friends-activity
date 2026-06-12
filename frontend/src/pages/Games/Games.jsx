import { useState, useEffect } from 'react'
import NavBar from '../../components/NavBar/NavBar'
import MediaGrid from '../../components/MediaGrid/MediaGrid'
import Pagination from '../../components/Pagination/Pagination'
import { fetchGames, addGame, togglePlayed, deleteGame } from '../../api/games'
import { getRole } from '../../api/auth'
import { useLang } from '../../i18n/LangContext'
import '../page.css'

const PAGE_SIZE = 20

export default function Games() {
  const { t } = useLang()
  const [games, setGames] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [errMsg, setErrMsg] = useState('')
  const canEdit = getRole() !== 'observer'

  function showErr(msg) {
    setErrMsg(msg)
    setTimeout(() => setErrMsg(''), 4000)
  }

  const extraFields = [
    { name: 'steam_link', placeholder: t('games.steamLink') },
  ]

  useEffect(() => {
    setLoading(true)
    fetchGames(page, PAGE_SIZE)
      .then(data => { setGames(data.items); setTotal(data.total) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page])

  function handleToggle(id) {
    togglePlayed(id)
      .then(u => setGames(p => p.map(g => g.id === id ? u : g)))
      .catch(() => showErr(t('common.errAction')))
  }

  function handleDelete(id) {
    const isLastOnPage = games.length === 1 && page > 1
    deleteGame(id)
      .then(() => {
        setGames(p => p.filter(g => g.id !== id))
        setTotal(n => n - 1)
        if (isLastOnPage) setPage(p => p - 1)
      })
      .catch(() => showErr(t('common.errDeleteFail')))
  }

  function handleItemAdded(game) {
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
        <MediaGrid
          pageTitle={t('games.title')}
          modalTitle={t('games.add')}
          items={games}
          loading={loading}
          checkedField="is_played"
          checkLabel={t('games.played')}
          linkField="steam_link"
          canEdit={canEdit}
          onToggle={handleToggle}
          onDelete={handleDelete}
          onAdd={(title, file, url, extras) => addGame(title, file, url, extras?.steam_link)}
          onItemAdded={handleItemAdded}
          extraFields={extraFields}
        />
        <Pagination page={page} total={total} limit={PAGE_SIZE} onChange={setPage} />
      </main>
    </div>
  )
}
