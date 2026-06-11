const API = import.meta.env.VITE_API_URL
const UPLOADS = import.meta.env.VITE_UPLOADS_URL

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
}

export async function fetchPhotos() {
  const res = await fetch(`${API}/photos/`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Ошибка загрузки')
  return res.json()
}

export async function uploadPhoto(file, description) {
  const form = new FormData()
  form.append('file', file)
  if (description) form.append('description', description)
  const res = await fetch(`${API}/photos/`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  })
  if (!res.ok) throw new Error('Ошибка загрузки')
  return res.json()
}

export async function deletePhoto(id) {
  const res = await fetch(`${API}/photos/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Ошибка удаления')
}

export function photoSrc(filename) {
  if (!filename) return null
  return `${UPLOADS}/photos/${filename}`
}
