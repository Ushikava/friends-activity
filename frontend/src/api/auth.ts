import type { UserInfo } from '../types'

const API = import.meta.env.VITE_API_URL

let _refreshPromise: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  if (_refreshPromise) return _refreshPromise
  _refreshPromise = (async () => {
    try {
      const res = await fetch(`${API}/refresh`, { method: 'POST', credentials: 'include' })
      if (!res.ok) return false
      const data = await res.json() as { username: string; role: string }
      localStorage.setItem('username', data.username)
      localStorage.setItem('role', data.role)
      return true
    } catch {
      return false
    }
  })()
  try {
    return await _refreshPromise
  } finally {
    _refreshPromise = null
  }
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, { ...options, credentials: 'include' })
  if (res.status !== 401) return res

  const refreshed = await tryRefresh()
  if (!refreshed) {
    clearSession()
    window.location.href = '/login'
    return res
  }

  return fetch(url, { ...options, credentials: 'include' })
}

export async function fetchUsers(): Promise<UserInfo[]> {
  const res = await fetch(`${API}/users`, { credentials: 'include' })
  if (!res.ok) throw new Error('Не удалось загрузить пользователей')
  return res.json() as Promise<UserInfo[]>
}

export async function login(username: string, password: string): Promise<{ username: string; role: string }> {
  const res = await fetch(`${API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    credentials: 'include',
  })
  if (!res.ok) {
    const err = await res.json() as { detail?: string }
    throw new Error(err.detail || 'Ошибка входа')
  }
  return res.json() as Promise<{ username: string; role: string }>
}

export function saveSession(data: { username: string; role: string }): void {
  localStorage.setItem('username', data.username)
  localStorage.setItem('role', data.role)
}

export function clearSession(): void {
  localStorage.removeItem('username')
  localStorage.removeItem('role')
}

export function getUsername(): string | null {
  return localStorage.getItem('username')
}

export function getRole(): string | null {
  return localStorage.getItem('role')
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API}/logout`, { method: 'POST', credentials: 'include' })
  } catch {}
  clearSession()
}

export async function deleteUser(username: string, password: string): Promise<void> {
  const res = await apiFetch(`${API}/users/${encodeURIComponent(username)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!res.ok) {
    const err = await res.json() as { detail?: string }
    throw new Error(err.detail || 'Ошибка удаления')
  }
}

export async function changeUsername(newUsername: string, password: string): Promise<UserInfo> {
  const res = await apiFetch(`${API}/me/username`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ new_username: newUsername, password }),
  })
  if (!res.ok) {
    const err = await res.json() as { detail?: string }
    throw new Error(err.detail || 'Ошибка')
  }
  return res.json() as Promise<UserInfo>
}

export async function createUser(username: string, password: string): Promise<UserInfo> {
  const res = await apiFetch(`${API}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const err = await res.json() as { detail?: string }
    throw new Error(err.detail || 'Ошибка создания пользователя')
  }
  return res.json() as Promise<UserInfo>
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const res = await apiFetch(`${API}/me/password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  })
  if (!res.ok) {
    const err = await res.json() as { detail?: string }
    throw new Error(err.detail || 'Ошибка')
  }
}
