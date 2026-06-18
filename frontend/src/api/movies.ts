import { apiFetch } from './auth'
import type { Movie, MovieDetail, PaginatedResponse } from '../types'

export interface TmdbMovie {
  tmdb_id: number
  title: string
  year: string
  poster_path: string
}

const API = import.meta.env.VITE_API_URL

export async function fetchMovies(page = 1, limit = 20, q?: string, status?: string): Promise<PaginatedResponse<Movie>> {
  const skip = (page - 1) * limit
  const params = new URLSearchParams({ skip: String(skip), limit: String(limit) })
  if (q) params.set('q', q)
  if (status) params.set('status', status)
  const res = await apiFetch(`${API}/movies/?${params}`)
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

  const res = await apiFetch(`${API}/movies/`, { method: 'POST', body: form })
  if (!res.ok) throw new Error('Ошибка добавления')
  return res.json() as Promise<Movie>
}

export async function fetchMovieDetail(id: number): Promise<MovieDetail> {
  const res = await apiFetch(`${API}/movies/${id}/detail`)
  if (!res.ok) throw new Error('Ошибка загрузки')
  return res.json() as Promise<MovieDetail>
}

export async function fetchMoviePageNumber(id: number, limit: number): Promise<number | null> {
  const res = await apiFetch(`${API}/movies/${id}/page-number?limit=${limit}`)
  if (!res.ok) return null
  const data = await res.json() as { page: number }
  return data.page
}

export async function toggleUserWatched(
  id: number,
  body?: { rating: number | null; review: string | null },
): Promise<MovieDetail> {
  const res = await apiFetch(`${API}/movies/${id}/watched`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
  if (!res.ok) throw new Error('Ошибка')
  return res.json() as Promise<MovieDetail>
}

export async function updateMovie(
  id: number,
  title: string,
  posterFile: File | null,
): Promise<{ id: number; title: string; poster: string | null }> {
  const form = new FormData()
  form.append('title', title)
  if (posterFile) form.append('file', posterFile)
  const res = await apiFetch(`${API}/movies/${id}`, { method: 'PATCH', body: form })
  if (!res.ok) throw new Error('Ошибка обновления')
  return res.json()
}

export async function deleteMovie(id: number): Promise<void> {
  const res = await apiFetch(`${API}/movies/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Ошибка удаления')
}

export async function searchTmdb(query: string): Promise<TmdbMovie[]> {
  const res = await apiFetch(`${API}/movies/tmdb-search?q=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error('Ошибка поиска')
  return res.json() as Promise<TmdbMovie[]>
}
