import { apiFetch } from './auth'
import type { Photo, PaginatedResponse } from '../types'

const API = import.meta.env.VITE_API_URL
const UPLOADS = import.meta.env.VITE_UPLOADS_URL

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
}

export async function fetchPhotos(page = 1, limit = 20): Promise<PaginatedResponse<Photo>> {
  const skip = (page - 1) * limit
  const res = await apiFetch(`${API}/photos/?skip=${skip}&limit=${limit}`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Ошибка загрузки')
  return res.json() as Promise<PaginatedResponse<Photo>>
}

export async function uploadPhoto(file: File, description?: string): Promise<Photo> {
  const form = new FormData()
  form.append('file', file)
  if (description) form.append('description', description)
  const res = await apiFetch(`${API}/photos/`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  })
  if (!res.ok) throw new Error('Ошибка загрузки')
  return res.json() as Promise<Photo>
}

export async function deletePhoto(id: number): Promise<void> {
  const res = await apiFetch(`${API}/photos/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Ошибка удаления')
}

export function photoSrc(filename: string | null | undefined): string | null {
  if (!filename) return null
  return `${UPLOADS}/photos/${filename}`
}
