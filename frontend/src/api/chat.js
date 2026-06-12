import { apiFetch, getToken } from './auth'

const API = import.meta.env.VITE_API_URL

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` }
}

// ── Rooms ─────────────────────────────────────────────────────────────────────

export async function fetchRooms() {
  const res = await apiFetch(`${API}/chat/rooms`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Ошибка загрузки комнат')
  return res.json()
}

export async function createRoom(name = 'Новый чат') {
  const res = await apiFetch(`${API}/chat/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error('Ошибка создания комнаты')
  return res.json()
}

export async function renameRoom(roomId, name) {
  const res = await apiFetch(`${API}/chat/rooms/${roomId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error('Ошибка переименования')
  return res.json()
}

export async function deleteRoom(roomId) {
  const res = await apiFetch(`${API}/chat/rooms/${roomId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Ошибка удаления комнаты')
}

// ── Messages ──────────────────────────────────────────────────────────────────

export async function fetchHistory(roomId) {
  const res = await apiFetch(`${API}/chat/rooms/${roomId}/history`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Ошибка загрузки истории')
  return res.json()
}

export async function clearHistory(roomId) {
  const res = await apiFetch(`${API}/chat/rooms/${roomId}/history`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Ошибка очистки истории')
}

export async function sendMessage(roomId, message, onChunk, onDone, onError) {
  let response
  try {
    response = await fetch(`${API}/chat/rooms/${roomId}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ message }),
    })
  } catch {
    onError()
    return
  }

  if (!response.ok) { onError(); return }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8', { fatal: false })
  let lineBuffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    lineBuffer += decoder.decode(value, { stream: true })
    const lines = lineBuffer.split('\n')
    lineBuffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') { onDone(); return }
      try {
        const parsed = JSON.parse(data)
        if (parsed.error) { onError(); return }
        if (parsed.content) onChunk(parsed.content)
      } catch { /* ignore malformed chunk */ }
    }
  }
  onDone()
}
