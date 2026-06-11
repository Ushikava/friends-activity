import { useState, useEffect } from 'react'
import NavBar from '../../components/NavBar/NavBar'
import MediaGrid from '../../components/MediaGrid/MediaGrid'
import { fetchGames, addGame, togglePlayed, deleteGame } from '../../api/games'
import { getRole } from '../../api/auth'
import '../page.css'

const EXTRA_FIELDS = [
  { name: 'steam_link', placeholder: 'Ссылка на Steam (необязательно)' },
]

export default function Games() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const canEdit = getRole() !== 'observer'

  useEffect(() => {
    fetchGames().then(setGames).catch(console.error).finally(() => setLoading(false))
  }, [])

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
          onToggle={id =>
            togglePlayed(id).then(u => setGames(p => p.map(g => g.id === id ? u : g)))
          }
          onDelete={id =>
            deleteGame(id).then(() => setGames(p => p.filter(g => g.id !== id)))
          }
          onAdd={(title, file, url, extras) => addGame(title, file, url, extras?.steam_link)}
          onItemAdded={g => setGames(p => [g, ...p])}
          extraFields={EXTRA_FIELDS}
        />
      </main>
    </div>
  )
}
