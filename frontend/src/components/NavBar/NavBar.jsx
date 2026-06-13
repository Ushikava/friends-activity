import { NavLink } from 'react-router-dom'
import { House, Image, GameControllerIcon, MountainsIcon, FilmStripIcon, UserIcon, ChatCircleIcon, SignInIcon } from '@phosphor-icons/react'
import { getRole } from '../../api/auth'
import { useLang } from '../../i18n/LangContext'
import './NavBar.css'

function NavIcon({ to, label, end, icon: Icon }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `navbar__item ${isActive ? 'navbar__item--active' : ''}`}
      title={label}
    >
      <span className="navbar__icon">
        <Icon size={28} weight="fill" />
      </span>
    </NavLink>
  )
}

export default function NavBar() {
  const isObserver = getRole() === 'observer'
  const { t } = useLang()

  return (
    <div className="navbar-wrapper">
    <nav className="navbar">
      <div className="navbar__left">
        <NavIcon to="/" end label={t('nav.home')} icon={House} />
      </div>

      <div className="navbar__center">
        <NavIcon to="/gallery" label={t('nav.gallery')} icon={Image} />
        <NavIcon to="/games"   label={t('nav.games')}   icon={GameControllerIcon} />
        <NavIcon to="/places"  label={t('nav.places')}  icon={MountainsIcon} />
        <NavIcon to="/movies"  label={t('nav.movies')}  icon={FilmStripIcon} />
        {!isObserver && (
          <NavIcon to="/chat" label={t('chat.title')} icon={ChatCircleIcon} />
        )}
      </div>

      <div className="navbar__right">
        {!isObserver
          ? <NavIcon to="/profile" label={t('nav.profile')} icon={UserIcon} />
          : <NavIcon to="/login"   label={t('nav.login')}   icon={SignInIcon} />
        }
      </div>
    </nav>
    </div>
  )
}
