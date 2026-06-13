import { apiFetch } from './auth'
import type { Place, PaginatedResponse } from '../types'

const API = import.meta.env.VITE_API_URL
const UPLOADS = import.meta.env.VITE_UPLOADS_URL

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
}

export async function fetchPlaces(page = 1, limit = 20): Promise<PaginatedResponse<Place>> {
  const skip = (page - 1) * limit
  const res = await apiFetch(`${API}/places/?skip=${skip}&limit=${limit}`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Ошибка загрузки')
  return res.json() as Promise<PaginatedResponse<Place>>
}

export async function uploadPlace(file: File, description?: string): Promise<Place> {
  const form = new FormData()
  form.append('file', file)
  if (description) form.append('description', description)
  const res = await apiFetch(`${API}/places/`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  })
  if (!res.ok) throw new Error('Ошибка загрузки')
  return res.json() as Promise<Place>
}

export async function deletePlace(id: number): Promise<void> {
  const res = await apiFetch(`${API}/places/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Ошибка удаления')
}

export function placeSrc(filename: string | null | undefined): string | null {
  if (!filename) return null
  return `${UPLOADS}/places/${filename}`
}
