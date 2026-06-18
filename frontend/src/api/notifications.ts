import { apiFetch } from './auth'
import type { Notification } from '../types'

const API = import.meta.env.VITE_API_URL

export async function fetchNotifications(): Promise<Notification[]> {
  const res = await apiFetch(`${API}/notifications/`)
  if (!res.ok) throw new Error('Ошибка загрузки')
  return res.json() as Promise<Notification[]>
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await apiFetch(`${API}/notifications/count`)
  if (!res.ok) return 0
  const data = await res.json() as { count: number }
  return data.count
}

export async function sendNotification(
  recipientId: number,
  entityType: 'movie' | 'game',
  entityId: number,
  entityTitle: string,
): Promise<void> {
  const res = await apiFetch(`${API}/notifications/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient_id: recipientId,
      entity_type: entityType,
      entity_id: entityId,
      entity_title: entityTitle,
    }),
  })
  if (!res.ok) throw new Error('Ошибка отправки')
}

export async function markRead(id: number): Promise<void> {
  await apiFetch(`${API}/notifications/${id}/read`, { method: 'PATCH' })
}

export async function markAllRead(): Promise<void> {
  await apiFetch(`${API}/notifications/read-all`, { method: 'POST' })
}

export async function deleteNotification(id: number): Promise<void> {
  await apiFetch(`${API}/notifications/${id}`, { method: 'DELETE' })
}
