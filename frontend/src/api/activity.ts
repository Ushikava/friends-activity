import { apiFetch } from './auth'
import type { Stats, ActivityData, FeedEvent } from '../types'

const API = import.meta.env.VITE_API_URL

export async function fetchActivity(): Promise<ActivityData> {
  const res = await fetch(`${API}/activity`, { credentials: 'include' })
  if (!res.ok) throw new Error('Ошибка загрузки активности')
  return res.json() as Promise<ActivityData>
}

export async function fetchStats(): Promise<Stats> {
  const res = await fetch(`${API}/stats`, { credentials: 'include' })
  if (!res.ok) throw new Error('Ошибка загрузки статистики')
  return res.json() as Promise<Stats>
}

export async function fetchFeed(): Promise<FeedEvent[]> {
  const res = await apiFetch(`${API}/feed`)
  if (!res.ok) throw new Error('Ошибка загрузки ленты')
  return res.json() as Promise<FeedEvent[]>
}
