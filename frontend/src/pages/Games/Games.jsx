import { useState, useEffect } from 'react'
import NavBar from '../../components/NavBar/NavBar'
import MediaGrid from '../../components/MediaGrid/MediaGrid'
import Pagination from '../../components/Pagination/Pagination'
import { fetchGames, addGame, togglePlayed, deleteGame } from '../../api/games'
import { getRole } from '../../api/auth'
import '../page.css'

const PAGE_SIZE = 20
const EXTRA_FIELDS = [
  { name: 'steam_link', placeholder: 'Ссылка на Steam (необязательно)' },
]

export default function Games() {
  const [games, setGames] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const canEdit = getRole() !== 'observer'

  useEffect(() => {
    setLoading(true)
    fetchGames(page, PAGE_SIZE)
      .then(data => { setGames(data.items); setTotal(data.total) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page])

  function handleToggle(id) {
    togglePlayed(id).then(u => setGames(p => p.map(g => g.id === id ? u : g)))
  }

  function handleDelete(id) {
    const isLastOnPage = games.length === 1 && page > 1
    deleteGame(id).then(() => {
      setGames(p => p.filter(g => g.id !== id))
      setTotal(t => t - 1)
      if (isLastOnPage) setPage(p => p - 1)
    })
  }

  function handleItemAdded(game) {
    if (page === 1) {
      setGames(p => [game, ...p.slice(0, PAGE_SIZE - 1)])
      setTotal(t => t + 1)
    } else {
      setPage(1)
    }
  }

  return (
    <div className="page">
      <NavBar />
      <main className="page__main">
        <MediaGrid
          pageTitle="Игры"
          modalTitle="Добавить игру"
          items={games}
          loading={loading}
          checkedField="is_played"
          checkLabel="Пройдено"
          linkField="steam_link"
          canEdit={canEdit}
          onToggle={handleToggle}
          onDelete={handleDelete}
          onAdd={(title, file, url, extras) => addGame(title, file, url, extras?.steam_link)}
          onItemAdded={handleItemAdded}
          extraFields={EXTRA_FIELDS}
        />
        <Pagination page={page} total={total} limit={PAGE_SIZE} onChange={setPage} />
      </main>
    </div>
  )
}
