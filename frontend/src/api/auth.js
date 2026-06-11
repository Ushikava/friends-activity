const API = import.meta.env.VITE_API_URL

export async function fetchUsers() {
  const res = await fetch(`${API}/users`)
  if (!res.ok) throw new Error('Не удалось загрузить пользователей')
  return res.json()
}

export async function login(username, password) {
  const res = await fetch(`${API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Ошибка входа')
  }
  return res.json()
}

export function saveSession(data) {
  localStorage.setItem('access_token', data.access_token)
  localStorage.setItem('refresh_token', data.refresh_token)
  localStorage.setItem('username', data.username)
  localStorage.setItem('role', data.role)
}

export function clearSession() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('username')
  localStorage.removeItem('role')
}

export function getToken() {
  return localStorage.getItem('access_token')
}

export function getUsername() {
  return localStorage.getItem('username')
}

export function getRole() {
  return localStorage.getItem('role')
}
