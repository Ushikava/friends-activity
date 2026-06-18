import { useState, useEffect } from 'react'
import { fetchUsers, getUsername } from '../../api/auth'
import { sendNotification } from '../../api/notifications'
import { useLang } from '../../i18n/LangContext'
import DateTimePicker from '../DateTimePicker/DateTimePicker'
import type { UserInfo } from '../../types'
import './InviteModal.css'

interface Props {
  entityType: 'movie' | 'game'
  entityId: number
  entityTitle: string
  doneUsernames: string[]
  onClose: () => void
}

export default function InviteModal({ entityType, entityId, entityTitle, doneUsernames, onClose }: Props) {
  const { t } = useLang()
  const me = getUsername()
  const [users, setUsers] = useState<UserInfo[]>([])
  const [sending, setSending] = useState<number | null>(null)
  const [sent, setSent] = useState<Set<number>>(new Set())
  const [err, setErr] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')

  useEffect(() => {
    fetchUsers()
      .then(all => setUsers(all.filter(u => u.username !== me && u.role !== 'observer')))
      .catch(() => setErr(t('common.errAction') as string))
  }, [])

  async function handleSend(user: UserInfo) {
    if (sending !== null || sent.has(user.id)) return
    setSending(user.id)
    setErr('')
    try {
      const isoScheduled = scheduledAt ? new Date(scheduledAt).toISOString() : null
      await sendNotification(user.id, entityType, entityId, entityTitle, isoScheduled)
      setSent(p => new Set(p).add(user.id))
    } catch {
      setErr(t('notif.errSend') as string)
    } finally {
      setSending(null)
    }
  }

  return (
    <div
      className="invite-backdrop"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="invite-modal" onClick={e => e.stopPropagation()}>
        <div className="invite-modal__header">
          <span className="invite-modal__title">{t('notif.inviteTitle') as string}</span>
          <button className="invite-modal__close" onClick={onClose}>×</button>
        </div>

        <p className="invite-modal__entity">{entityTitle}</p>

        <div className="invite-modal__schedule">
          <label className="invite-modal__schedule-label">{t('notif.scheduleLabel') as string}</label>
          <DateTimePicker
            value={scheduledAt}
            onChange={setScheduledAt}
            placeholder={t('notif.scheduleLabel') as string}
            minDateTime={new Date().toISOString().slice(0, 16)}
          />
        </div>

        {err && <p className="invite-modal__err">{err}</p>}

        <ul className="invite-modal__list">
          {users.map(u => {
            const isDone = doneUsernames.includes(u.username)
            const isSent = sent.has(u.id)
            const isLoading = sending === u.id
            return (
              <li key={u.id} className="invite-user">
                <span className={`invite-user__check${isDone ? ' invite-user__check--done' : ''}`}>
                  {isDone ? '✓' : ''}
                </span>
                <span className="invite-user__name">{u.username}</span>
                <button
                  className={`invite-user__btn${isSent ? ' invite-user__btn--sent' : ''}`}
                  onClick={() => handleSend(u)}
                  disabled={isSent || isLoading}
                >
                  {isLoading ? '…' : isSent ? '✓' : t('notif.invite') as string}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
