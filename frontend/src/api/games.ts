import { apiFetch } from './auth'
import type { Game, GameDetail, PaginatedResponse } from '../types'

export interface SteamGame {
  appid: number
  name: string
  thumbnail: string
}

export interface SteamImage {
  cover_url: string
}

const API = import.meta.env.VITE_API_URL

export async function fetchGames(page = 1, limit = 20, q?: string, status?: string): Promise<PaginatedResponse<Game>> {
  const skip = (page - 1) * limit
  const params = new URLSearchParams({ skip: String(skip), limit: String(limit) })
  if (q) params.set('q', q)
  if (status) params.set('status', status)
  const res = await apiFetch(`${API}/games/?${params}`)
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

  const res = await apiFetch(`${API}/games/`, { method: 'POST', body: form })
  if (!res.ok) throw new Error('Ошибка добавления')
  return res.json() as Promise<Game>
}

export async function fetchGameDetail(id: number): Promise<GameDetail> {
  const res = await apiFetch(`${API}/games/${id}/detail`)
  if (!res.ok) throw new Error('Ошибка загрузки')
  return res.json() as Promise<GameDetail>
}

export async function fetchGamePageNumber(id: number, limit: number): Promise<number | null> {
  const res = await apiFetch(`${API}/games/${id}/page-number?limit=${limit}`)
  if (!res.ok) return null
  const data = await res.json() as { page: number }
  return data.page
}

export async function toggleUserPlayed(
  id: number,
  body?: { rating: number | null; review: string | null },
): Promise<GameDetail> {
  const res = await apiFetch(`${API}/games/${id}/played`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
  if (!res.ok) throw new Error('Ошибка')
  return res.json() as Promise<GameDetail>
}

export async function updateGame(
  id: number,
  title: string,
  posterFile: File | null,
  steamLink: string,
): Promise<{ id: number; title: string; poster: string | null; steam_link: string | null }> {
  const form = new FormData()
  form.append('title', title)
  if (posterFile) form.append('file', posterFile)
  form.append('steam_link', steamLink)
  const res = await apiFetch(`${API}/games/${id}`, { method: 'PATCH', body: form })
  if (!res.ok) throw new Error('Ошибка обновления')
  return res.json()
}

export async function deleteGame(id: number): Promise<void> {
  const res = await apiFetch(`${API}/games/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Ошибка удаления')
}

export async function searchSteam(query: string): Promise<SteamGame[]> {
  const res = await apiFetch(`${API}/games/steam-search?q=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error('Ошибка поиска')
  return res.json() as Promise<SteamGame[]>
}

export async function fetchSteamImage(appid: number): Promise<SteamImage> {
  const res = await apiFetch(`${API}/games/steam-image?appid=${appid}`)
  if (!res.ok) throw new Error('Ошибка загрузки обложки')
  return res.json() as Promise<SteamImage>
}
