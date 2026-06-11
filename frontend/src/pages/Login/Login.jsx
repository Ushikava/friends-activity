import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, saveSession, fetchUsers } from '../../api/auth'
import './Login.css'

import layout1 from '../../assets/Login/layout_1.svg'
import layout2 from '../../assets/Login/layout_2.svg'
import maskot from '../../assets/Login/maskot.svg'

function IconEye() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function IconEyeOff() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

function CustomSelect({ options, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selected = options.find(o => o.username === value)

  return (
    <div className="custom-select" ref={ref}>
      <button
        type="button"
        className={`custom-select__trigger ${open ? 'custom-select__trigger--open' : ''}`}
        onClick={() => setOpen(v => !v)}
      >
        <span>{selected ? selected.username : '—'}</span>
        <svg className="custom-select__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <ul className="custom-select__list">
          {options.map(o => (
            <li
              key={o.username}
              className={`custom-select__item ${o.username === value ? 'custom-select__item--active' : ''}`}
              onClick={() => { onChange(o.username); setOpen(false) }}
            >
              {o.username}
              {o.role === 'observer' && <span className="custom-select__badge">наблюдатель</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function Login() {
  const [users, setUsers] = useState([])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchUsers().then(data => {
      setUsers(data)
      if (data.length > 0) setUsername(data[0].username)
    })
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(username, password)
      saveSession(data)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <img src={layout2} className="login-bg login-bg--tl" alt="" />
      <img src={layout1} className="login-bg login-bg--br" alt="" />

      <div className="login-content">
        <img src={maskot} className="login-maskot" alt="" />

        <form className="login-form" onSubmit={handleSubmit}>
          <h1 className="login-title">FA Login</h1>

          <div className="login-field">
            <CustomSelect options={users} value={username} onChange={setUsername} />
          </div>

          <div className="login-field">
            <div className="password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Пароль"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(v => !v)}
                tabIndex={-1}
              >
                {showPassword ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
          </div>

          {error && <p className="login-error">{error}</p>}

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}
