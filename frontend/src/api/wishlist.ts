import { apiFetch } from './auth'
import type { WishlistItem, WishlistCurrency } from '../types'

const API = import.meta.env.VITE_API_URL

export async function fetchWishlist(userId?: number): Promise<WishlistItem[]> {
  const url = userId != null ? `${API}/wishlist?user_id=${userId}` : `${API}/wishlist`
  const res = await apiFetch(url)
  if (!res.ok) throw new Error('Ошибка загрузки вишлиста')
  return res.json() as Promise<WishlistItem[]>
}

export async function addWishlistItem(data: {
  title: string
  url: string
  price: number | null
  currency: WishlistCurrency
}): Promise<WishlistItem> {
  const res = await apiFetch(`${API}/wishlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Ошибка добавления')
  return res.json() as Promise<WishlistItem>
}

export async function deleteWishlistItem(id: number): Promise<void> {
  const res = await apiFetch(`${API}/wishlist/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Ошибка удаления')
}
