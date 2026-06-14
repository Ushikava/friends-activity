import { useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import NavBar from '../../components/NavBar/NavBar'
import { getUsername, getRole, changeUsername, changePassword, createUser } from '../../api/auth'
import { useLang } from '../../i18n/LangContext'
import '../page.css'
import './Profile.css'
import '../../components/MediaGrid/mediaGrid.css'

interface StatusInfo {
  ok: boolean
  text: string
}

interface SettingCardProps {
  title: string
  children: ReactNode
}

function SettingCard({ title, children }: SettingCardProps) {
  return (
    <div className="profile-card">
      <h2 className="profile-card__title">{title}</h2>
      {children}
    </div>
  )
}

function StatusMessage({ status }: { status: StatusInfo | null }) {
  if (!status) return null
  return (
    <p className={`profile-status ${status.ok ? 'profile-status--ok' : 'profile-status--err'}`}>
      {status.text}
    </p>
  )
}

export default function Profile() {
  const { t, lang, setLanguage } = useLang()
  const [currentUsername, setCurrentUsername] = useState(getUsername() || '')
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')

  function toggleTheme(next: string) {
    document.documentElement.dataset.theme = next
    localStorage.setItem('theme', next)
    setTheme(next)
  }

  const [newUsername, setNewUsername] = useState('')
  const [usernamePassword, setUsernamePassword] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<StatusInfo | null>(null)
  const [usernameLoading, setUsernameLoading] = useState(false)

  const [newUserUsername, setNewUserUsername] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserStatus, setNewUserStatus] = useState<StatusInfo | null>(null)
  const [newUserLoading, setNewUserLoading] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState<StatusInfo | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)

  async function handleNewUserSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setNewUserStatus(null)
    setNewUserLoading(true)
    try {
      await createUser(newUserUsername, newUserPassword)
      setNewUserUsername('')
      setNewUserPassword('')
      setNewUserStatus({ ok: true, text: t('profile.addUser.saved') })
    } catch (err) {
      setNewUserStatus({ ok: false, text: (err as Error).message })
    } finally {
      setNewUserLoading(false)
    }
  }

  async function handleUsernameSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setUsernameStatus(null)
    setUsernameLoading(true)
    try {
      const data = await changeUsername(newUsername, usernamePassword)
      localStorage.setItem('username', data.username)
      setCurrentUsername(data.username)
      setNewUsername('')
      setUsernamePassword('')
      setUsernameStatus({ ok: true, text: t('profile.changeName.saved') })
    } catch (err) {
      setUsernameStatus({ ok: false, text: (err as Error).message })
    } finally {
      setUsernameLoading(false)
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPasswordStatus(null)
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ ok: false, text: t('profile.changePass.mismatch') })
      return
    }
    setPasswordLoading(true)
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordStatus({ ok: true, text: t('profile.changePass.saved') })
    } catch (err) {
      setPasswordStatus({ ok: false, text: (err as Error).message })
    } finally {
      setPasswordLoading(false)
    }
  }

  if (getRole() === 'observer') return <Navigate to="/" replace />

  return (
    <div className="page">
      <NavBar />
      <main className="page__main">
        <h1 className="media-header__title">{t('profile.title')}</h1>
        <p className="profile-greeting">{t('profile.greeting')} {currentUsername}</p>

        <div className="profile-grid">
          <SettingCard title={t('profile.changeName.title')}>
            <form onSubmit={handleUsernameSubmit} className="profile-form">
              <input
                type="text"
                placeholder={t('profile.changeName.new')}
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder={t('profile.changeName.password')}
                value={usernamePassword}
                onChange={e => setUsernamePassword(e.target.value)}
                required
              />
              <StatusMessage status={usernameStatus} />
              <button type="submit" disabled={usernameLoading || !newUsername || !usernamePassword}>
                {usernameLoading ? t('common.saving') : t('common.save')}
              </button>
            </form>
          </SettingCard>

          <SettingCard title={t('profile.changePass.title')}>
            <form onSubmit={handlePasswordSubmit} className="profile-form">
              <input
                type="password"
                placeholder={t('profile.changePass.current')}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder={t('profile.changePass.new')}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder={t('profile.changePass.confirm')}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
              <StatusMessage status={passwordStatus} />
              <button type="submit" disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}>
                {passwordLoading ? t('common.saving') : t('common.save')}
              </button>
            </form>
          </SettingCard>

          <SettingCard title={t('profile.addUser.title')}>
            <form onSubmit={handleNewUserSubmit} className="profile-form">
              <input
                type="text"
                placeholder={t('profile.addUser.username')}
                value={newUserUsername}
                onChange={e => setNewUserUsername(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder={t('profile.addUser.password')}
                value={newUserPassword}
                onChange={e => setNewUserPassword(e.target.value)}
                required
              />
              <StatusMessage status={newUserStatus} />
              <button type="submit" disabled={newUserLoading || !newUserUsername || !newUserPassword}>
                {newUserLoading ? t('common.saving') : t('profile.addUser.submit')}
              </button>
            </form>
          </SettingCard>

          <SettingCard title={t('profile.lang.title')}>
            <div className="profile-lang-toggle">
              <button
                className={`profile-lang-btn${lang === 'ru' ? ' profile-lang-btn--active' : ''}`}
                onClick={() => setLanguage('ru')}
              >
                {t('profile.lang.ru')}
              </button>
              <button
                className={`profile-lang-btn${lang === 'en' ? ' profile-lang-btn--active' : ''}`}
                onClick={() => setLanguage('en')}
              >
                {t('profile.lang.en')}
              </button>
            </div>
          </SettingCard>

          <SettingCard title={t('profile.theme.title')}>
            <div className="profile-lang-toggle">
              <button
                className={`profile-lang-btn${theme === 'light' ? ' profile-lang-btn--active' : ''}`}
                onClick={() => toggleTheme('light')}
              >
                {t('profile.theme.light')}
              </button>
              <button
                className={`profile-lang-btn${theme === 'dark' ? ' profile-lang-btn--active' : ''}`}
                onClick={() => toggleTheme('dark')}
              >
                {t('profile.theme.dark')}
              </button>
            </div>
          </SettingCard>
        </div>
      </main>
    </div>
  )
}
