import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUsername, changeUsername, changePassword, createUser, logout, deleteUser, clearSession } from '../../../api/auth'
import { useLang } from '../../../i18n/LangContext'

type SettingKey = 'username' | 'password' | 'addUser' | 'deleteUser' | 'deleteSelf' | 'lang' | 'theme'

interface Props {
  setPending: (p: { fn: () => Promise<void>; title: string; confirmLabel: string; danger?: boolean } | null) => void
  showToast: (ok: boolean, msg: string) => void
}

export default function ProfileManagement({ setPending, showToast }: Props) {
  const { t, lang, setLanguage } = useLang()
  const navigate = useNavigate()
  const [currentUsername, setCurrentUsername] = useState(getUsername() || '')
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const [active, setActive] = useState<SettingKey>('username')

  const [newUsername, setNewUsername] = useState('')
  const [usernamePassword, setUsernamePassword] = useState('')
  const [usernameLoading, setUsernameLoading] = useState(false)

  const [newUserUsername, setNewUserUsername] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserLoading, setNewUserLoading] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  const [deleteTargetUsername, setDeleteTargetUsername] = useState('')
  const [deleteTargetPassword, setDeleteTargetPassword] = useState('')
  const [deleteUserLoading, setDeleteUserLoading] = useState(false)

  const [deleteSelfPassword, setDeleteSelfPassword] = useState('')
  const [deleteSelfLoading, setDeleteSelfLoading] = useState(false)

  function toggleTheme(next: string) {
    document.documentElement.dataset.theme = next
    localStorage.setItem('theme', next)
    setTheme(next)
  }

  function handleLogout() {
    setPending({ fn: doLogout, title: t('profile.logout') as string, confirmLabel: t('profile.logout') as string, danger: true })
  }
  async function doLogout() { await logout(); navigate('/login') }

  function handleUsernameSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending({ fn: doChangeUsername, title: t('profile.changeName.title') as string, confirmLabel: t('common.save') as string })
  }
  async function doChangeUsername() {
    setUsernameLoading(true)
    try {
      const data = await changeUsername(newUsername, usernamePassword)
      localStorage.setItem('username', data.username)
      setCurrentUsername(data.username); setNewUsername(''); setUsernamePassword('')
      showToast(true, t('profile.changeName.saved') as string)
    } catch (err) { showToast(false, (err as Error).message) }
    finally { setUsernameLoading(false) }
  }

  function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (newPassword !== confirmPassword) { showToast(false, t('profile.changePass.mismatch') as string); return }
    setPending({ fn: doChangePassword, title: t('profile.changePass.title') as string, confirmLabel: t('common.save') as string })
  }
  async function doChangePassword() {
    setPasswordLoading(true)
    try {
      await changePassword(currentPassword, newPassword)
      clearSession(); window.location.href = '/login'
    } catch (err) { showToast(false, (err as Error).message) }
    finally { setPasswordLoading(false) }
  }

  function handleNewUserSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending({ fn: doCreateUser, title: t('profile.addUser.title') as string, confirmLabel: t('profile.addUser.submit') as string })
  }
  async function doCreateUser() {
    setNewUserLoading(true)
    try {
      await createUser(newUserUsername, newUserPassword)
      setNewUserUsername(''); setNewUserPassword('')
      showToast(true, t('profile.addUser.saved') as string)
    } catch (err) { showToast(false, (err as Error).message) }
    finally { setNewUserLoading(false) }
  }

  function handleDeleteUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending({ fn: doDeleteUser, title: t('profile.deleteUser.title') as string, confirmLabel: t('profile.deleteUser.submit') as string, danger: true })
  }
  async function doDeleteUser() {
    setDeleteUserLoading(true)
    try {
      await deleteUser(deleteTargetUsername, deleteTargetPassword)
      setDeleteTargetUsername(''); setDeleteTargetPassword('')
      showToast(true, t('profile.deleteUser.saved') as string)
    } catch (err) { showToast(false, (err as Error).message) }
    finally { setDeleteUserLoading(false) }
  }

  function handleDeleteSelf(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending({ fn: doDeleteSelf, title: t('profile.deleteSelf.title') as string, confirmLabel: t('profile.deleteSelf.submit') as string, danger: true })
  }
  async function doDeleteSelf() {
    setDeleteSelfLoading(true)
    try {
      await deleteUser(currentUsername, deleteSelfPassword)
      await logout(); navigate('/login')
    } catch (err) { showToast(false, (err as Error).message); setDeleteSelfLoading(false) }
  }

  function navItem(key: SettingKey, label: string, danger = false) {
    return (
      <button
        key={key}
        className={`profile-nav-item${active === key ? ' profile-nav-item--active' : ''}${danger ? ' profile-nav-item--danger' : ''}`}
        onClick={() => setActive(key)}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="profile-settings">
      <nav className="profile-sidebar">
        <div className="profile-nav-group">
          <p className="profile-nav-group__label">{t('profile.group.account') as string}</p>
          {navItem('username', t('profile.changeName.title') as string)}
          {navItem('password', t('profile.changePass.title') as string)}
          {navItem('deleteSelf', t('profile.deleteSelf.title') as string, true)}
        </div>
        <div className="profile-nav-group">
          <p className="profile-nav-group__label">{t('profile.group.users') as string}</p>
          {navItem('addUser', t('profile.addUser.title') as string)}
          {navItem('deleteUser', t('profile.deleteUser.title') as string, true)}
        </div>
        <div className="profile-nav-group">
          <p className="profile-nav-group__label">{t('profile.group.interface') as string}</p>
          {navItem('lang', t('profile.lang.title') as string)}
          {navItem('theme', t('profile.theme.title') as string)}
        </div>
        <div className="profile-sidebar__logout">
          <button className="profile-nav-item profile-nav-item--danger" onClick={handleLogout}>
            {t('profile.logout') as string}
          </button>
        </div>
      </nav>

      <div className="profile-content">
        {active === 'username' && <>
          <h2 className="profile-content__title">{t('profile.changeName.title') as string}</h2>
          <form onSubmit={handleUsernameSubmit} className="profile-form" autoComplete="off">
            <input type="text" autoComplete="off" placeholder={t('profile.changeName.new') as string} value={newUsername} onChange={e => setNewUsername(e.target.value)} required />
            <input type="password" autoComplete="new-password" placeholder={t('profile.changeName.password') as string} value={usernamePassword} onChange={e => setUsernamePassword(e.target.value)} required />
            <button type="submit" disabled={usernameLoading || !newUsername || !usernamePassword}>
              {usernameLoading ? t('common.saving') as string : t('common.save') as string}
            </button>
          </form>
        </>}

        {active === 'password' && <>
          <h2 className="profile-content__title">{t('profile.changePass.title') as string}</h2>
          <form onSubmit={handlePasswordSubmit} className="profile-form" autoComplete="off">
            <input type="password" autoComplete="new-password" placeholder={t('profile.changePass.current') as string} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
            <input type="password" autoComplete="new-password" placeholder={t('profile.changePass.new') as string} value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            <input type="password" autoComplete="new-password" placeholder={t('profile.changePass.confirm') as string} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            <button type="submit" disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}>
              {passwordLoading ? t('common.saving') as string : t('common.save') as string}
            </button>
          </form>
        </>}

        {active === 'addUser' && <>
          <h2 className="profile-content__title">{t('profile.addUser.title') as string}</h2>
          <form onSubmit={handleNewUserSubmit} className="profile-form" autoComplete="off">
            <input type="text" autoComplete="off" placeholder={t('profile.addUser.username') as string} value={newUserUsername} onChange={e => setNewUserUsername(e.target.value)} required />
            <input type="password" autoComplete="new-password" placeholder={t('profile.addUser.password') as string} value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} required />
            <button type="submit" disabled={newUserLoading || !newUserUsername || !newUserPassword}>
              {newUserLoading ? t('common.saving') as string : t('profile.addUser.submit') as string}
            </button>
          </form>
        </>}

        {active === 'deleteUser' && <>
          <h2 className="profile-content__title">{t('profile.deleteUser.title') as string}</h2>
          <form onSubmit={handleDeleteUser} className="profile-form" autoComplete="off">
            <input type="text" autoComplete="off" placeholder={t('profile.deleteUser.username') as string} value={deleteTargetUsername} onChange={e => setDeleteTargetUsername(e.target.value)} required />
            <input type="password" autoComplete="new-password" placeholder={t('profile.deleteUser.password') as string} value={deleteTargetPassword} onChange={e => setDeleteTargetPassword(e.target.value)} required />
            <button type="submit" className="profile-form__btn--danger" disabled={deleteUserLoading || !deleteTargetUsername || !deleteTargetPassword}>
              {deleteUserLoading ? t('common.saving') as string : t('profile.deleteUser.submit') as string}
            </button>
          </form>
        </>}

        {active === 'deleteSelf' && <>
          <h2 className="profile-content__title">{t('profile.deleteSelf.title') as string}</h2>
          <form onSubmit={handleDeleteSelf} className="profile-form" autoComplete="off">
            <input type="password" autoComplete="new-password" placeholder={t('profile.deleteSelf.password') as string} value={deleteSelfPassword} onChange={e => setDeleteSelfPassword(e.target.value)} required />
            <button type="submit" className="profile-form__btn--danger" disabled={deleteSelfLoading || !deleteSelfPassword}>
              {deleteSelfLoading ? t('common.saving') as string : t('profile.deleteSelf.submit') as string}
            </button>
          </form>
        </>}

        {active === 'lang' && <>
          <h2 className="profile-content__title">{t('profile.lang.title') as string}</h2>
          <div className="profile-lang-toggle">
            <button className={`profile-lang-btn${lang === 'ru' ? ' profile-lang-btn--active' : ''}`} onClick={() => setLanguage('ru')}>{t('profile.lang.ru') as string}</button>
            <button className={`profile-lang-btn${lang === 'en' ? ' profile-lang-btn--active' : ''}`} onClick={() => setLanguage('en')}>{t('profile.lang.en') as string}</button>
          </div>
        </>}

        {active === 'theme' && <>
          <h2 className="profile-content__title">{t('profile.theme.title') as string}</h2>
          <div className="profile-lang-toggle">
            <button className={`profile-lang-btn${theme === 'light' ? ' profile-lang-btn--active' : ''}`} onClick={() => toggleTheme('light')}>{t('profile.theme.light') as string}</button>
            <button className={`profile-lang-btn${theme === 'dark' ? ' profile-lang-btn--active' : ''}`} onClick={() => toggleTheme('dark')}>{t('profile.theme.dark') as string}</button>
          </div>
        </>}
      </div>
    </div>
  )
}
