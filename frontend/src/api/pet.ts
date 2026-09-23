import { apiFetch } from './auth'
import type { PetState } from '../types'

const API = import.meta.env.VITE_API_URL

export async function fetchPet(): Promise<PetState | null> {
  const res = await apiFetch(`${API}/pet/`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Не удалось загрузить питомца')
  return res.json() as Promise<PetState>
}

export async function feedPet(itemId: string): Promise<PetState> {
  const res = await apiFetch(`${API}/pet/feed/${itemId}`, { method: 'POST' })
  if (!res.ok) {
    const err = await res.json() as { detail?: string }
    throw new Error(err.detail || 'Не удалось покормить')
  }
  return res.json() as Promise<PetState>
}

export async function playWithPet(itemId: string): Promise<PetState> {
  const res = await apiFetch(`${API}/pet/play/${itemId}`, { method: 'POST' })
  if (!res.ok) {
    const err = await res.json() as { detail?: string }
    throw new Error(err.detail || 'Не удалось поиграть')
  }
  return res.json() as Promise<PetState>
}

export async function setPetEnvironment(itemId: string | null): Promise<PetState> {
  const res = await apiFetch(`${API}/pet/environment`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ item_id: itemId }),
  })
  if (!res.ok) {
    const err = await res.json() as { detail?: string }
    throw new Error(err.detail || 'Не удалось сменить фон')
  }
  return res.json() as Promise<PetState>
}

export async function renamePet(name: string): Promise<PetState> {
  const res = await apiFetch(`${API}/pet/name`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) {
    const err = await res.json() as { detail?: string }
    throw new Error(err.detail || 'Не удалось переименовать')
  }
  return res.json() as Promise<PetState>
}
