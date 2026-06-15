import { useLang } from '../../i18n/LangContext'
import type { FeedEvent } from '../../types'
import './ActivityFeed.css'

interface GroupedEvent extends FeedEvent {
  count: number
}

const STACKABLE_ACTIONS = new Set(['photo_upload', 'place_upload', 'movie_add', 'game_add'])

function groupEvents(events: FeedEvent[]): GroupedEvent[] {
  const groups = new Map<string, GroupedEvent>()
  for (const event of events) {
    const day = event.created_at.slice(0, 10)
    const key = STACKABLE_ACTIONS.has(event.action)
      ? `${event.username}|${event.action}|${day}`
      : `id:${event.id}`
    if (groups.has(key)) {
      groups.get(key)!.count++
    } else {
      groups.set(key, { ...event, count: 1 })
    }
  }
  return Array.from(groups.values())
}

const ACTION_ICONS: Record<string, string> = {
  photo_upload: '🖼️',
  photo_delete: '🗑️',
  place_upload: '📍',
  place_delete: '🗑️',
  movie_add:    '🎬',
  movie_delete: '🗑️',
  movie_watched:  '✅',
  movie_reviewed: '⭐',
  game_add:       '🎮',
  game_delete:    '🗑️',
  game_played:    '🏆',
  game_reviewed:  '⭐',
  user_created: '👤',
}

function actionCategory(action: string): string {
  if (action.startsWith('photo')) return 'photo'
  if (action.startsWith('place')) return 'place'
  if (action.startsWith('movie')) return 'movie'
  if (action.startsWith('game'))  return 'game'
  return 'user'
}

function formatRelativeTime(isoString: string, lang: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffMin  = Math.floor(diffMs / 60_000)
  const diffHour = Math.floor(diffMs / 3_600_000)
  const diffDay  = Math.floor(diffMs / 86_400_000)

  if (lang === 'ru') {
    if (diffMin  < 1)  return 'только что'
    if (diffMin  < 60) return `${diffMin} мин назад`
    if (diffHour < 24) return `${diffHour} ч назад`
    if (diffDay  === 1) return 'вчера'
    if (diffDay  < 7)  return `${diffDay} дн назад`
    return new Date(isoString).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  }
  if (diffMin  < 1)  return 'just now'
  if (diffMin  < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay  === 1) return 'yesterday'
  if (diffDay  < 7)  return `${diffDay}d ago`
  return new Date(isoString).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

interface Props {
  events: FeedEvent[]
}

export default function ActivityFeed({ events }: Props) {
  const { t, lang } = useLang()

  if (events.length === 0) {
    return (
      <section className="feed-section">
        <h2 className="home-section__title">{t('home.feed') as string}</h2>
        <p className="feed__empty">{t('common.empty') as string}</p>
      </section>
    )
  }

  const grouped = groupEvents(events)

  return (
    <section className="feed-section">
      <h2 className="home-section__title" style={{ marginBottom: 16 }}>{t('home.feed') as string}</h2>
      <ul className="feed">
        {grouped.map(event => (
          <li key={event.id} className="feed__item">
            <span className={`feed__icon feed__icon--${actionCategory(event.action)}`}>
              {ACTION_ICONS[event.action] ?? '•'}
            </span>
            <div className="feed__body">
              <p className="feed__text">
                <strong>{event.username ?? '???'}</strong>
                {' '}
                {t(`feed.${event.action}`) as string}
                {event.count === 1 && event.entity_title && (
                  <> <em className="feed__entity">{event.entity_title}</em></>
                )}
                {event.count > 1 && (
                  <span className="feed__count">×{event.count}</span>
                )}
              </p>
              <time className="feed__time">{formatRelativeTime(event.created_at, lang)}</time>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
