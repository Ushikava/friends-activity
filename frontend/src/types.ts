// ── Auth ──────────────────────────────────────────────────────────────────────

export interface SessionData {
  username: string
  role: string
}

export interface UserInfo {
  id: number
  username: string
  role: string
}

// ── Paginated response ────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[]
  total: number
}

// ── Media ─────────────────────────────────────────────────────────────────────

export interface Photo {
  id: number
  filename: string
  description: string | null
  uploaded_at: string
}

export interface Place {
  id: number
  filename: string
  description: string | null
  uploaded_at: string
}

export interface Movie {
  id: number
  title: string
  poster: string | null
  watch_count: number
  user_count: number
  is_watched_by_me: boolean
  created_at: string
}

export interface MovieUserStatus {
  user_id: number
  username: string
  is_watched: boolean
  rating: number | null
  review: string | null
}

export interface MovieDetail {
  id: number
  title: string
  poster: string | null
  created_at: string
  statuses: MovieUserStatus[]
}

export interface Game {
  id: number
  title: string
  poster: string | null
  steam_link: string | null
  play_count: number
  user_count: number
  is_played_by_me: boolean
  created_at: string
}

export interface GameUserStatus {
  user_id: number
  username: string
  is_played: boolean
  rating: number | null
  review: string | null
}

export interface GameDetail {
  id: number
  title: string
  poster: string | null
  steam_link: string | null
  created_at: string
  statuses: GameUserStatus[]
}

// ── Stats & Activity ──────────────────────────────────────────────────────────

export interface Stats {
  photos: number
  places: number
  movies: { total: number; watched: number }
  games: { total: number; played: number }
}

export type ActivityData = Record<string, number>

export interface FeedEvent {
  id: number
  username: string | null
  action: string
  entity_title: string | null
  created_at: string
}

// ── Chat ──────────────────────────────────────────────────────────────────────

export interface ChatRoom {
  id: number
  name: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  error?: boolean
}
