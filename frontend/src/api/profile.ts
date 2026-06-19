import { apiFetch } from './auth'
import type { UserProfile, FeedEvent } from '../types'

const API = import.meta.env.VITE_API_URL
const UPLOADS = import.meta.env.VITE_UPLOADS_URL

export function avatarSrc(url: string | null): string | null {
  return url ? `${UPLOADS}/${url}` : null
}

export async function fetchMyProfile(): Promise<UserProfile> {
  const res = await apiFetch(`${API}/profile/me`)
  if (!res.ok) throw new Error('Ошибка загрузки профиля')
  return res.json() as Promise<UserProfile>
}

export async function uploadAvatar(file: File): Promise<UserProfile> {
  const form = new FormData()
  form.append('file', file)
  const res = await apiFetch(`${API}/profile/avatar`, { method: 'POST', body: form })
  if (!res.ok) throw new Error('Ошибка загрузки аватара')
  return res.json() as Promise<UserProfile>
}

export async function fetchUsers(): Promise<UserProfile[]> {
  const res = await apiFetch(`${API}/profile/users`)
  if (!res.ok) throw new Error('Ошибка загрузки пользователей')
  return res.json() as Promise<UserProfile[]>
}

export async function fetchUserFeed(userId: number): Promise<FeedEvent[]> {
  const res = await apiFetch(`${API}/feed?user_id=${userId}`)
  if (!res.ok) throw new Error('Ошибка загрузки ленты')
  return res.json() as Promise<FeedEvent[]>
}
