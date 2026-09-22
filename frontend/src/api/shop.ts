import { apiFetch } from './auth'
import type { ShopCatalog, ShopPurchaseResult } from '../types'

const API = import.meta.env.VITE_API_URL

export async function fetchShopCatalog(): Promise<ShopCatalog> {
  const res = await apiFetch(`${API}/shop/items`)
  if (!res.ok) throw new Error('Не удалось загрузить магазин')
  return res.json() as Promise<ShopCatalog>
}

export async function purchaseItem(itemId: string): Promise<ShopPurchaseResult> {
  const res = await apiFetch(`${API}/shop/purchase/${itemId}`, { method: 'POST' })
  if (!res.ok) {
    const err = await res.json() as { detail?: string }
    throw new Error(err.detail || 'Не удалось купить')
  }
  return res.json() as Promise<ShopPurchaseResult>
}
