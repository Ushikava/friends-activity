const API = import.meta.env.VITE_API_URL

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
}

export async function fetchMovies() {
  const res = await fetch(`${API}/movies/`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Ошибка загрузки')
  return res.json()
}

export async function addMovie(title, posterFile, posterUrl) {
  const form = new FormData()
  form.append('title', title)
  if (posterFile) form.append('file', posterFile)
  if (posterUrl && !posterFile) form.append('poster_url', posterUrl)

  const res = await fetch(`${API}/movies/`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  })
  if (!res.ok) throw new Error('Ошибка добавления')
  return res.json()
}

export async function toggleWatched(id) {
  const res = await fetch(`${API}/movies/${id}/watched`, {
    method: 'PATCH',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Ошибка')
  return res.json()
}

export async function deleteMovie(id) {
  const res = await fetch(`${API}/movies/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Ошибка удаления')
}
