import { useState, useEffect, useRef } from 'react'
import { useLang } from '../../../i18n/LangContext'
import { fetchMyProfile, fetchUsers, fetchUserFeed, uploadAvatar, avatarSrc } from '../../../api/profile'
import ActivityFeed from '../../../components/ActivityFeed/ActivityFeed'
import AvatarCropModal from '../../../components/AvatarCropModal/AvatarCropModal'
import type { UserProfile, FeedEvent } from '../../../types'

const AVATAR_COLORS = ['#e57373', '#81c784', '#64b5f6', '#ffb74d', '#ba68c8', '#4db6ac', '#f06292', '#aed581']

function formatLastActive(iso: string | null, lang: string): string {
  if (!iso) return lang === 'ru' ? 'нет активности' : 'no activity'
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (lang === 'ru') {
    if (min < 2) return 'только что'
    if (min < 60) return `${min} мин назад`
    if (h < 24) return `${h} ч назад`
    if (d < 7) return `${d} дн назад`
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  }
  if (min < 2) return 'just now'
  if (min < 60) return `${min}m ago`
  if (h < 24) return `${h}h ago`
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

function userColor(username: string): string {
  let hash = 0
  for (const c of username) hash = (hash * 31 + c.charCodeAt(0)) & 0xfffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function initials(username: string): string {
  return username.slice(0, 2).toUpperCase()
}

interface AvatarProps {
  profile: UserProfile | null
  size?: number
}

function Avatar({ profile, size = 40 }: AvatarProps) {
  const src = profile ? avatarSrc(profile.avatar_url) : null
  const name = profile?.username ?? ''
  const bg = !name ? 'var(--surface)' : src ? 'transparent' : userColor(name)
  return (
    <div
      className="pinfo__avatar-circle"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.35 }}
    >
      {src
        ? <img src={src} alt={name} className="pinfo__avatar-img" />
        : name ? <span>{initials(name)}</span> : null
      }
    </div>
  )
}

interface Props {
  showToast: (ok: boolean, msg: string) => void
}

export default function ProfileInfo({ showToast }: Props) {
  const { t, lang } = useLang()
  const fileRef = useRef<HTMLInputElement>(null)

  const [myProfile, setMyProfile] = useState<UserProfile | null>(null)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [feed, setFeed] = useState<FeedEvent[]>([])
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)

  useEffect(() => {
    fetchMyProfile()
      .then(p => { setMyProfile(p); return fetchUserFeed(p.id) })
      .then(setFeed)
      .catch(() => {})
    fetchUsers().then(setUsers).catch(() => {})
  }, [])

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    setCropSrc(objectUrl)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleCropConfirm(blob: Blob) {
    setCropSrc(null)
    setAvatarLoading(true)
    try {
      const file = new File([blob], 'avatar.webp', { type: 'image/webp' })
      const updated = await uploadAvatar(file)
      setMyProfile(updated)
      showToast(true, t('profile.info.avatarSaved') as string)
    } catch (err) {
      showToast(false, (err as Error).message)
    } finally {
      setAvatarLoading(false)
    }
  }

  function handleCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  function roleBadge(role: string) {
    const key = `profile.info.role.${role}`
    return t(key) as string || role
  }

  return (
    <div className="pinfo">
      {cropSrc && (
        <AvatarCropModal
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
          confirmLabel={t('profile.info.avatarSave') as string}
          cancelLabel={t('common.cancel') as string}
        />
      )}

      {/* ── Header: my avatar + scrollable users ── */}
      <div className="pinfo__header">
        <div className="pinfo__self">
          <div className="pinfo__avatar-wrap" onClick={() => !avatarLoading && fileRef.current?.click()}>
            <Avatar profile={myProfile} size={64} />
            <div className="pinfo__avatar-overlay">
              {avatarLoading
                ? <span className="pinfo__avatar-hint">{t('profile.info.avatarLoading') as string}</span>
                : <span className="pinfo__avatar-hint">{t('profile.info.changeAvatar') as string}</span>
              }
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
          <div className="pinfo__header-text">
            <span className="pinfo__username">{myProfile?.username ?? '...'}</span>
            {myProfile && <span className="pinfo__role">{roleBadge(myProfile.role)}</span>}
          </div>
        </div>

        <div className="pinfo__divider" />

        <ul className="pinfo__users-scroll">
          {users.map(u => (
            <li key={u.id} className="pinfo__user-card">
              <Avatar profile={u} size={44} />
              <span className="pinfo__user-name">{u.username}</span>
              <span className="pinfo__user-last">{formatLastActive(u.last_active, lang)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Feed full width ── */}
      <ActivityFeed events={feed} />
    </div>
  )
}
