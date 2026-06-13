import type { Stats, ActivityData } from '../types'

const API = import.meta.env.VITE_API_URL

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function fetchActivity(): Promise<ActivityData> {
  const res = await fetch(`${API}/activity`)
  if (!res.ok) throw new Error('Ошибка загрузки активности')
  return res.json() as Promise<ActivityData>
}

export async function fetchStats(): Promise<Stats> {
  const res = await fetch(`${API}/stats`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Ошибка загрузки статистики')
  return res.json() as Promise<Stats>
}
