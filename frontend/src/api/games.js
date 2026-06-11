const API = import.meta.env.VITE_API_URL

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
}

export async function fetchGames() {
  const res = await fetch(`${API}/games/`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Ошибка загрузки')
  return res.json()
}

export async function addGame(title, posterFile, posterUrl, steamLink) {
  const form = new FormData()
  form.append('title', title)
  if (posterFile) form.append('file', posterFile)
  if (posterUrl && !posterFile) form.append('poster_url', posterUrl)
  if (steamLink) form.append('steam_link', steamLink)

  const res = await fetch(`${API}/games/`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  })
  if (!res.ok) throw new Error('Ошибка добавления')
  return res.json()
}

export async function togglePlayed(id) {
  const res = await fetch(`${API}/games/${id}/played`, {
    method: 'PATCH',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Ошибка')
  return res.json()
}

export async function deleteGame(id) {
  const res = await fetch(`${API}/games/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Ошибка удаления')
}
