import { apiFetch } from './auth'
import type { Movie, PaginatedResponse } from '../types'

const API = import.meta.env.VITE_API_URL

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
}

export async function fetchMovies(page = 1, limit = 20): Promise<PaginatedResponse<Movie>> {
  const skip = (page - 1) * limit
  const res = await apiFetch(`${API}/movies/?skip=${skip}&limit=${limit}`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Ошибка загрузки')
  return res.json() as Promise<PaginatedResponse<Movie>>
}

export async function addMovie(
  title: string,
  posterFile: File | null,
  posterUrl: string | null,
): Promise<Movie> {
  const form = new FormData()
  form.append('title', title)
  if (posterFile) form.append('file', posterFile)
  if (posterUrl && !posterFile) form.append('poster_url', posterUrl)

  const res = await apiFetch(`${API}/movies/`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  })
  if (!res.ok) throw new Error('Ошибка добавления')
  return res.json() as Promise<Movie>
}

export async function toggleWatched(id: number): Promise<Movie> {
  const res = await apiFetch(`${API}/movies/${id}/watched`, {
    method: 'PATCH',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Ошибка')
  return res.json() as Promise<Movie>
}

export async function deleteMovie(id: number): Promise<void> {
  const res = await apiFetch(`${API}/movies/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Ошибка удаления')
}
