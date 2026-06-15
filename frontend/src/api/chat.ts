import { apiFetch } from './auth'
import type { ChatRoom, ChatMessage } from '../types'

const API = import.meta.env.VITE_API_URL

export async function fetchRooms(): Promise<ChatRoom[]> {
  const res = await apiFetch(`${API}/chat/rooms`)
  if (!res.ok) throw new Error('Ошибка загрузки комнат')
  return res.json() as Promise<ChatRoom[]>
}

export async function createRoom(name = 'Новый чат'): Promise<ChatRoom> {
  const res = await apiFetch(`${API}/chat/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error('Ошибка создания комнаты')
  return res.json() as Promise<ChatRoom>
}

export async function renameRoom(roomId: number, name: string): Promise<ChatRoom> {
  const res = await apiFetch(`${API}/chat/rooms/${roomId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error('Ошибка переименования')
  return res.json() as Promise<ChatRoom>
}

export async function deleteRoom(roomId: number): Promise<void> {
  const res = await apiFetch(`${API}/chat/rooms/${roomId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Ошибка удаления комнаты')
}

export async function fetchHistory(roomId: number): Promise<ChatMessage[]> {
  const res = await apiFetch(`${API}/chat/rooms/${roomId}/history`)
  if (!res.ok) throw new Error('Ошибка загрузки истории')
  return res.json() as Promise<ChatMessage[]>
}

export async function clearHistory(roomId: number): Promise<void> {
  const res = await apiFetch(`${API}/chat/rooms/${roomId}/history`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Ошибка очистки истории')
}

export async function sendMessage(
  roomId: number,
  message: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: () => void,
): Promise<void> {
  let response: Response
  try {
    response = await fetch(`${API}/chat/rooms/${roomId}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
      credentials: 'include',
    })
  } catch {
    onError()
    return
  }

  if (!response.ok) { onError(); return }

  const reader = response.body!.getReader()
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
        const parsed = JSON.parse(data) as { error?: string; content?: string }
        if (parsed.error) { onError(); return }
        if (parsed.content) onChunk(parsed.content)
      } catch { /* ignore malformed chunk */ }
    }
  }
  onDone()
}
