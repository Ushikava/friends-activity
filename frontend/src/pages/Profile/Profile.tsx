import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import NavBar from '../../components/NavBar/NavBar'
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal'
import ToastContainer, { useToast } from '../../components/Toast/Toast'
import { getRole } from '../../api/auth'
import { useLang } from '../../i18n/LangContext'
import ProfileInfo from './tabs/ProfileInfo'
import ProfileWishlist from './tabs/ProfileWishlist'
import ProfileManagement from './tabs/ProfileManagement'
import '../page.css'
import './Profile.css'

type ProfileTab = 'info' | 'wishlist' | 'management'

export default function Profile() {
  const { t } = useLang()
  const { toasts, showToast } = useToast()
  const [tab, setTab] = useState<ProfileTab>('info')
  const [pending, setPending] = useState<{ fn: () => Promise<void>; title: string; confirmLabel: string; danger?: boolean } | null>(null)

  async function handleConfirm() {
    if (!pending) return
    const fn = pending.fn
    setPending(null)
    await fn()
  }

  if (getRole() === 'observer') return <Navigate to="/" replace />

  return (
    <div className="page">
      <NavBar />
      <ToastContainer toasts={toasts} />
      {pending && (
        <ConfirmModal
          title={pending.title}
          body={null}
          confirmLabel={pending.confirmLabel}
          danger={pending.danger}
          onConfirm={handleConfirm}
          onCancel={() => setPending(null)}
        />
      )}
      <main className="page__main">
        <div className="profile-statusbar">
          <span className="profile-statusbar__title">{t('profile.title')}</span>
          <div className="profile-tabs">
            {(['info', 'wishlist', 'management'] as ProfileTab[]).map(key => (
              <button
                key={key}
                className={`profile-tab${tab === key ? ' profile-tab--active' : ''}`}
                onClick={() => setTab(key)}
              >
                {t(`profile.tab.${key}`) as string}
              </button>
            ))}
          </div>
        </div>

        {tab === 'info' && <ProfileInfo showToast={showToast} />}
        {tab === 'wishlist' && <ProfileWishlist showToast={showToast} />}
        {tab === 'management' && <ProfileManagement setPending={setPending} showToast={showToast} />}
      </main>
    </div>
  )
}
