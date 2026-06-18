import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
function BellPartialIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="nbf-clip">
          <rect x="8" y="0" width="16" height="24" />
        </clipPath>
      </defs>
      {/* filled bottom 2/3 */}
      <path
        clipPath="url(#nbf-clip)"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 0 1-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 1 1-7.48 0 24.585 24.585 0 0 1-4.831-1.244.75.75 0 0 1-.298-1.205A8.217 8.217 0 0 0 5.25 9.75V9Zm4.502 8.9a2.25 2.25 0 1 0 4.496 0 25.057 25.057 0 0 1-4.496 0Z"
      />
      {/* outline on top */}
      <path
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
      />
    </svg>
  )
}
import { fetchNotifications, fetchUnreadCount, markRead, markAllRead, deleteNotification } from '../../api/notifications'
import { useLang } from '../../i18n/LangContext'
import type { Notification } from '../../types'
import './NotificationBell.css'

function formatTime(iso: string, lang: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  const diffHour = Math.floor(diffMs / 3_600_000)
  const diffDay = Math.floor(diffMs / 86_400_000)
  if (lang === 'ru') {
    if (diffMin < 1) return 'только что'
    if (diffMin < 60) return `${diffMin} мин назад`
    if (diffHour < 24) return `${diffHour} ч назад`
    if (diffDay === 1) return 'вчера'
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  }
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay === 1) return 'yesterday'
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

export default function NotificationBell() {
  const { t, lang } = useLang()
  const navigate = useNavigate()
  const PAGE_SIZE = 5
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(0)
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchUnreadCount().then(setCount).catch(() => {})
    const interval = setInterval(() => {
      fetchUnreadCount().then(setCount).catch(() => {})
    }, 30_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  async function handleOpen() {
    if (open) { setOpen(false); return }
    setOpen(true)
    setPage(0)
    setLoading(true)
    try {
      const data = await fetchNotifications()
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkAllRead() {
    await markAllRead()
    setItems(p => p.map(n => ({ ...n, is_read: true })))
    setCount(0)
  }

  async function handleRead(n: Notification) {
    if (!n.is_read) {
      await markRead(n.id)
      setItems(p => p.map(x => x.id === n.id ? { ...x, is_read: true } : x))
      setCount(c => Math.max(0, c - 1))
    }
    setOpen(false)
    navigate(n.entity_type === 'movie' ? `/movies?movie=${n.entity_id}` : `/games?game=${n.entity_id}`)
  }

  async function handleDelete(e: React.MouseEvent, id: number, isRead: boolean) {
    e.stopPropagation()
    await deleteNotification(id)
    setItems(p => p.filter(n => n.id !== id))
    if (!isRead) setCount(c => Math.max(0, c - 1))
  }

  return (
    <div className="notif-bell" ref={ref}>
      <button
        className={`notif-bell__btn navbar__item${open ? ' navbar__item--active' : ''}`}
        onClick={handleOpen}
        title={t('notif.title') as string}
      >
        <span className="navbar__icon notif-bell__icon-wrap">
          <BellPartialIcon />
          {count > 0 && <span className="notif-bell__badge">{count > 9 ? '9+' : count}</span>}
        </span>
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-panel__header">
            <span className="notif-panel__title">{t('notif.title') as string}</span>
            {items.some(n => !n.is_read) && (
              <button className="notif-panel__read-all" onClick={handleMarkAllRead}>
                {t('notif.markAllRead') as string}
              </button>
            )}
          </div>

          {loading && <div className="notif-panel__loading" />}

          {!loading && items.length === 0 && (
            <p className="notif-panel__empty">{t('notif.empty') as string}</p>
          )}

          {!loading && items.length > 0 && (() => {
            const totalPages = Math.ceil(items.length / PAGE_SIZE)
            const pageItems = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
            return (
              <>
                <ul className="notif-panel__list">
                  {pageItems.map(n => (
                    <li
                      key={n.id}
                      className={`notif-item${n.is_read ? ' notif-item--read' : ''}`}
                      onClick={() => handleRead(n)}
                    >
                      <div className="notif-item__body">
                        <p className="notif-item__text">
                          <strong>{n.sender_username}</strong>
                          {' '}
                          {t(`notif.invite.${n.entity_type}`) as string}
                          {' '}
                          <em>{n.entity_title}</em>
                        </p>
                        <time className="notif-item__time">{formatTime(n.created_at, lang)}</time>
                      </div>
                      <button
                        className="notif-item__delete"
                        onClick={e => handleDelete(e, n.id, n.is_read)}
                        title="Удалить"
                      >×</button>
                    </li>
                  ))}
                </ul>
                {totalPages > 1 && (
                  <div className="notif-panel__pagination">
                    <button
                      className="notif-panel__pg-btn"
                      onClick={() => setPage(p => p - 1)}
                      disabled={page === 0}
                    >←</button>
                    <span className="notif-panel__pg-info">{page + 1} / {totalPages}</span>
                    <button
                      className="notif-panel__pg-btn"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= totalPages - 1}
                    >→</button>
                  </div>
                )}
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
