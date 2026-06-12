import { NavLink } from 'react-router-dom'
import { getRole } from '../../api/auth'
import { useLang } from '../../i18n/LangContext'
import homeIcon    from '../../assets/NavBar/Home_na.svg'
import galleryIcon from '../../assets/NavBar/Gallery_na.svg'
import gamesIcon   from '../../assets/NavBar/Games_na.svg'
import placesIcon  from '../../assets/NavBar/Places_na.svg'
import moviesIcon  from '../../assets/NavBar/Movies_na.svg'
import profileIcon from '../../assets/NavBar/Profile_na.svg'
import './NavBar.css'

function NavIcon({ to, label, end, icon }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `navbar__item ${isActive ? 'navbar__item--active' : ''}`}
      title={label}
    >
      <span className="navbar__icon">
        <img src={icon} className="navbar__icon-img" alt={label} />
      </span>
    </NavLink>
  )
}

function NavIconSvg({ to, label, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `navbar__item ${isActive ? 'navbar__item--active' : ''}`}
      title={label}
    >
      <span className="navbar__icon">{children}</span>
    </NavLink>
  )
}

export default function NavBar() {
  const isObserver = getRole() === 'observer'
  const { t } = useLang()

  return (
    <nav className="navbar">
      <div className="navbar__left">
        <NavIcon to="/" end label={t('nav.home')} icon={homeIcon} />
      </div>

      <div className="navbar__center">
        <NavIcon to="/gallery" label={t('nav.gallery')} icon={galleryIcon} />
        <NavIcon to="/games"   label={t('nav.games')}   icon={gamesIcon} />
        <NavIcon to="/places"  label={t('nav.places')}  icon={placesIcon} />
        <NavIcon to="/movies"  label={t('nav.movies')}  icon={moviesIcon} />
        {!isObserver && (
          <NavIconSvg to="/chat" label={t('chat.title')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </NavIconSvg>
        )}
      </div>

      <div className="navbar__right">
        {!isObserver && <NavIcon to="/profile" label={t('nav.profile')} icon={profileIcon} />}
      </div>
    </nav>
  )
}
