import type { SessionData, UserInfo } from '../types'

const API = import.meta.env.VITE_API_URL

let _refreshPromise: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  if (_refreshPromise) return _refreshPromise
  _refreshPromise = (async () => {
    const rt = localStorage.getItem('refresh_token')
    if (!rt) return false
    try {
      const res = await fetch(`${API}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: rt }),
      })
      if (!res.ok) return false
      saveSession(await res.json() as SessionData)
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
  const res = await fetch(url, options)
  if (res.status !== 401) return res

  const refreshed = await tryRefresh()
  if (!refreshed) {
    clearSession()
    window.location.href = '/login'
    return res
  }

  return fetch(url, {
    ...options,
    headers: { ...(options.headers as Record<string, string>), Authorization: `Bearer ${getToken()}` },
  })
}

export async function fetchUsers(): Promise<UserInfo[]> {
  const res = await fetch(`${API}/users`)
  if (!res.ok) throw new Error('Не удалось загрузить пользователей')
  return res.json() as Promise<UserInfo[]>
}

export async function login(username: string, password: string): Promise<SessionData> {
  const res = await fetch(`${API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const err = await res.json() as { detail?: string }
    throw new Error(err.detail || 'Ошибка вход��')
  }
  return res.json() as Promise<SessionData>
}

export function saveSession(data: SessionData): void {
  localStorage.setItem('access_token', data.access_token)
  localStorage.setItem('refresh_token', data.refresh_token)
  localStorage.setItem('username', data.username)
  localStorage.setItem('role', data.role)
}

export function clearSession(): void {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('username')
  localStorage.removeItem('role')
}

export function getToken(): string | null {
  return localStorage.getItem('access_token')
}

export function getUsername(): string | null {
  return localStorage.getItem('username')
}

export function getRole(): string | null {
  return localStorage.getItem('role')
}

export async function changeUsername(newUsername: string, password: string): Promise<UserInfo> {
  const res = await apiFetch(`${API}/me/username`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
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
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
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
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  })
  if (!res.ok) {
    const err = await res.json() as { detail?: string }
    throw new Error(err.detail || 'Ошибка')
  }
}
