import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import NavBar from '../../components/NavBar/NavBar'
import { getUsername, getRole, changeUsername, changePassword } from '../../api/auth'
import '../page.css'
import './Profile.css'
import '../../components/MediaGrid/mediaGrid.css'

function SettingCard({ title, children }) {
  return (
    <div className="profile-card">
      <h2 className="profile-card__title">{title}</h2>
      {children}
    </div>
  )
}

function StatusMessage({ status }) {
  if (!status) return null
  return (
    <p className={`profile-status ${status.ok ? 'profile-status--ok' : 'profile-status--err'}`}>
      {status.text}
    </p>
  )
}

export default function Profile() {
  const [currentUsername, setCurrentUsername] = useState(getUsername() || '')

  const [newUsername, setNewUsername] = useState('')
  const [usernamePassword, setUsernamePassword] = useState('')
  const [usernameStatus, setUsernameStatus] = useState(null)
  const [usernameLoading, setUsernameLoading] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState(null)
  const [passwordLoading, setPasswordLoading] = useState(false)

  async function handleUsernameSubmit(e) {
    e.preventDefault()
    setUsernameStatus(null)
    setUsernameLoading(true)
    try {
      const data = await changeUsername(newUsername, usernamePassword)
      localStorage.setItem('username', data.username)
      setCurrentUsername(data.username)
      setNewUsername('')
      setUsernamePassword('')
      setUsernameStatus({ ok: true, text: 'Имя пользователя изменено' })
    } catch (err) {
      setUsernameStatus({ ok: false, text: err.message })
    } finally {
      setUsernameLoading(false)
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    setPasswordStatus(null)
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ ok: false, text: 'Пароли не совпадают' })
      return
    }
    setPasswordLoading(true)
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordStatus({ ok: true, text: 'Пароль изменён' })
    } catch (err) {
      setPasswordStatus({ ok: false, text: err.message })
    } finally {
      setPasswordLoading(false)
    }
  }

  if (getRole() === 'observer') return <Navigate to="/" replace />

  return (
    <div className="page">
      <NavBar />
      <main className="page__main">
        <h1 className="media-header__title">Профиль</h1>
        <p className="profile-greeting">Привет, {currentUsername}</p>

        <div className="profile-grid">
          <SettingCard title="Изменить имя">
            <form onSubmit={handleUsernameSubmit} className="profile-form">
              <input
                type="text"
                placeholder="Новое имя"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Текущий пароль"
                value={usernamePassword}
                onChange={e => setUsernamePassword(e.target.value)}
                required
              />
              <StatusMessage status={usernameStatus} />
              <button type="submit" disabled={usernameLoading || !newUsername || !usernamePassword}>
                {usernameLoading ? 'Сохранение...' : 'Сохранить'}
              </button>
            </form>
          </SettingCard>

          <SettingCard title="Изменить пароль">
            <form onSubmit={handlePasswordSubmit} className="profile-form">
              <input
                type="password"
                placeholder="Текущий пароль"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Новый пароль"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Повторите пароль"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
              <StatusMessage status={passwordStatus} />
              <button type="submit" disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}>
                {passwordLoading ? 'Сохранение...' : 'Сохранить'}
              </button>
            </form>
          </SettingCard>
        </div>
      </main>
    </div>
  )
}
