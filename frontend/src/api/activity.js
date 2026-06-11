const API = import.meta.env.VITE_API_URL

export async function fetchActivity() {
  const res = await fetch(`${API}/activity`)
  if (!res.ok) throw new Error('Ошибка загрузки активности')
  return res.json()
}

export async function fetchStats() {
  const res = await fetch(`${API}/stats`)
  if (!res.ok) throw new Error('Ошибка загрузки статистики')
  return res.json()
}
