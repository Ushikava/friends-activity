import { apiFetch } from './auth'
import type { Photo, PaginatedResponse } from '../types'

const API = import.meta.env.VITE_API_URL
const UPLOADS = import.meta.env.VITE_UPLOADS_URL

export async function fetchPhotos(page = 1, limit = 20, q?: string, sort?: string): Promise<PaginatedResponse<Photo>> {
  const skip = (page - 1) * limit
  const params = new URLSearchParams({ skip: String(skip), limit: String(limit) })
  if (q) params.set('q', q)
  if (sort) params.set('sort', sort)
  const res = await apiFetch(`${API}/photos/?${params}`)
  if (!res.ok) throw new Error('Ошибка загрузки')
  return res.json() as Promise<PaginatedResponse<Photo>>
}

export async function uploadPhoto(file: File, description?: string): Promise<Photo> {
  const form = new FormData()
  form.append('file', file)
  if (description) form.append('description', description)
  const res = await apiFetch(`${API}/photos/`, { method: 'POST', body: form })
  if (!res.ok) throw new Error('Ошибка загрузки')
  return res.json() as Promise<Photo>
}

export async function updatePhotoDescription(id: number, description: string | null): Promise<void> {
  const res = await apiFetch(`${API}/photos/${id}/description`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  })
  if (!res.ok) throw new Error('Ошибка обновления описания')
}

export async function fetchPhotoById(id: number): Promise<Photo> {
  const res = await apiFetch(`${API}/photos/${id}`)
  if (!res.ok) throw new Error('Фото не найдено')
  return res.json() as Promise<Photo>
}

export async function deletePhoto(id: number): Promise<void> {
  const res = await apiFetch(`${API}/photos/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Ошибка удаления')
}

export function photoSrc(filename: string | null | undefined): string | null {
  if (!filename) return null
  return `${UPLOADS}/photos/${filename}`
}
