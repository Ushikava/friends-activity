import { apiFetch } from './auth'
import type { CoinBalance, CoinTransaction } from '../types'

const API = import.meta.env.VITE_API_URL

export async function fetchCoinBalance(): Promise<CoinBalance> {
  const res = await apiFetch(`${API}/coins/balance`)
  if (!res.ok) throw new Error('Не удалось загрузить баланс')
  return res.json() as Promise<CoinBalance>
}

export async function fetchCoinTransactions(): Promise<CoinTransaction[]> {
  const res = await apiFetch(`${API}/coins/transactions`)
  if (!res.ok) throw new Error('Не удалось загрузить историю')
  return res.json() as Promise<CoinTransaction[]>
}
