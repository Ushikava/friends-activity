import { apiFetch } from './auth'
import type { Game, PaginatedResponse } from '../types'

const API = import.meta.env.VITE_API_URL

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
}

export async function fetchGames(page = 1, limit = 20): Promise<PaginatedResponse<Game>> {
  const skip = (page - 1) * limit
  const res = await apiFetch(`${API}/games/?skip=${skip}&limit=${limit}`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Ошибка загрузки')
  return res.json() as Promise<PaginatedResponse<Game>>
}

export async function addGame(
  title: string,
  posterFile: File | null,
  posterUrl: string | null,
  steamLink: string | null,
): Promise<Game> {
  const form = new FormData()
  form.append('title', title)
  if (posterFile) form.append('file', posterFile)
  if (posterUrl && !posterFile) form.append('poster_url', posterUrl)
  if (steamLink) form.append('steam_link', steamLink)

  const res = await apiFetch(`${API}/games/`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  })
  if (!res.ok) throw new Error('Ошибка добавления')
  return res.json() as Promise<Game>
}

export async function togglePlayed(id: number): Promise<Game> {
  const res = await apiFetch(`${API}/games/${id}/played`, {
    method: 'PATCH',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Ошибка')
  return res.json() as Promise<Game>
}

export async function deleteGame(id: number): Promise<void> {
  const res = await apiFetch(`${API}/games/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Ошибка удаления')
}
