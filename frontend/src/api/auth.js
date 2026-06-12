const API = import.meta.env.VITE_API_URL

// Один Promise на всех — чтобы параллельные 401 не запускали refresh дважды
let _refreshPromise = null

async function tryRefresh() {
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
      saveSession(await res.json())
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

export async function apiFetch(url, options = {}) {
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
    headers: { ...options.headers, Authorization: `Bearer ${getToken()}` },
  })
}

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

export async function changeUsername(newUsername, password) {
  const res = await apiFetch(`${API}/me/username`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ new_username: newUsername, password }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Ошибка')
  }
  return res.json()
}

export async function changePassword(currentPassword, newPassword) {
  const res = await apiFetch(`${API}/me/password`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Ошибка')
  }
  return res.json()
}
