const API = import.meta.env.VITE_API_URL
const UPLOADS = import.meta.env.VITE_UPLOADS_URL

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
}

export async function fetchPlaces(page = 1, limit = 20) {
  const skip = (page - 1) * limit
  const res = await fetch(`${API}/places/?skip=${skip}&limit=${limit}`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Ошибка загрузки')
  return res.json()
}

export async function uploadPlace(file, description) {
  const form = new FormData()
  form.append('file', file)
  if (description) form.append('description', description)
  const res = await fetch(`${API}/places/`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  })
  if (!res.ok) throw new Error('Ошибка загрузки')
  return res.json()
}

export async function deletePlace(id) {
  const res = await fetch(`${API}/places/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Ошибка удаления')
}

export function placeSrc(filename) {
  if (!filename) return null
  return `${UPLOADS}/places/${filename}`
}
