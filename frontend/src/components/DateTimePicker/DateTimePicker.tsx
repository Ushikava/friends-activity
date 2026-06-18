import { useState, useEffect, useRef } from 'react'
import { useLang } from '../../i18n/LangContext'
import './DateTimePicker.css'

interface Props {
  value: string             // "YYYY-MM-DDTHH:MM" or ""
  onChange: (value: string) => void
  placeholder?: string
  minDateTime?: string      // "YYYY-MM-DDTHH:MM"
}

const DAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const DAYS_EN = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTHS_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']

function pad2(n: number) { return String(n).padStart(2, '0') }
function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function firstWeekday(y: number, m: number) { return (new Date(y, m, 1).getDay() + 6) % 7 } // Mon = 0

function formatDisplay(value: string, lang: string): string {
  const d = new Date(value)
  if (lang === 'ru') return d.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function DateTimePicker({ value, onChange, placeholder, minDateTime }: Props) {
  const { lang } = useLang()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`

  const parseValue = (v: string) => ({
    dateStr: v.slice(0, 10),
    hour:    v.slice(11, 13) || '12',
    minute:  v.slice(14, 16) || '00',
  })

  const initialYear  = value ? new Date(value).getFullYear()  : today.getFullYear()
  const initialMonth = value ? new Date(value).getMonth()      : today.getMonth()

  const [viewYear,  setViewYear]  = useState(initialYear)
  const [viewMonth, setViewMonth] = useState(initialMonth)
  const [selDate,   setSelDate]   = useState(value ? parseValue(value).dateStr : '')
  const [hour,      setHour]      = useState(value ? parseValue(value).hour    : '12')
  const [minute,    setMinute]    = useState(value ? parseValue(value).minute  : '00')

  useEffect(() => {
    if (value) {
      const p = parseValue(value)
      const d = new Date(value)
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
      setSelDate(p.dateStr)
      setHour(p.hour)
      setMinute(p.minute)
    } else {
      setSelDate('')
    }
  }, [value])

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  function emit(dateStr: string, h: string, m: string) {
    if (dateStr) onChange(`${dateStr}T${h}:${m}`)
  }

  function handleDayClick(y: number, mo: number, d: number) {
    const ds = `${y}-${pad2(mo + 1)}-${pad2(d)}`
    const dt = `${ds}T${hour}:${minute}`
    if (minDateTime && dt < minDateTime.slice(0, 16)) return
    setSelDate(ds)
    emit(ds, hour, minute)
  }

  function handleHour(raw: string) {
    const v = Math.max(0, Math.min(23, Number(raw) || 0))
    const h = pad2(v)
    setHour(h)
    emit(selDate, h, minute)
  }

  function handleMinute(raw: string) {
    const v = Math.max(0, Math.min(59, Number(raw) || 0))
    const m = pad2(v)
    setMinute(m)
    emit(selDate, hour, m)
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  // Build 42 cells (6 weeks × 7 days)
  const first = firstWeekday(viewYear, viewMonth)
  const dim   = daysInMonth(viewYear, viewMonth)
  const prevY = viewMonth === 0 ? viewYear - 1 : viewYear
  const prevM = viewMonth === 0 ? 11 : viewMonth - 1
  const nextY = viewMonth === 11 ? viewYear + 1 : viewYear
  const nextM = viewMonth === 11 ? 0 : viewMonth + 1
  const dimPrev = daysInMonth(prevY, prevM)

  type Cell = { y: number; mo: number; d: number; cur: boolean }
  const cells: Cell[] = []
  for (let i = 0; i < first; i++)
    cells.push({ y: prevY, mo: prevM, d: dimPrev - first + 1 + i, cur: false })
  for (let d = 1; d <= dim; d++)
    cells.push({ y: viewYear, mo: viewMonth, d, cur: true })
  while (cells.length < 42)
    cells.push({ y: nextY, mo: nextM, d: cells.length - first - dim + 1, cur: false })

  const DAYS   = lang === 'ru' ? DAYS_RU   : DAYS_EN
  const MONTHS = lang === 'ru' ? MONTHS_RU : MONTHS_EN

  return (
    <div className="dtp" ref={ref}>
      <button
        type="button"
        className={`dtp__trigger${selDate ? ' dtp__trigger--filled' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <svg className="dtp__cal-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="4" width="18" height="18" rx="2.5"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        <span className="dtp__trigger-text">
          {selDate ? formatDisplay(`${selDate}T${hour}:${minute}`, lang) : (placeholder ?? '—')}
        </span>
        {selDate && (
          <span
            className="dtp__clear"
            role="button"
            onClick={e => { e.stopPropagation(); setSelDate(''); onChange('') }}
          >×</span>
        )}
      </button>

      {open && (
        <div className="dtp__panel">
          <div className="dtp__nav">
            <button type="button" className="dtp__nav-btn" onClick={prevMonth}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span className="dtp__month-label">{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" className="dtp__nav-btn" onClick={nextMonth}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>

          <div className="dtp__weekdays">
            {DAYS.map(d => <span key={d} className="dtp__wd">{d}</span>)}
          </div>

          <div className="dtp__grid">
            {cells.map((c, i) => {
              const ds = `${c.y}-${pad2(c.mo + 1)}-${pad2(c.d)}`
              const dt = `${ds}T${hour}:${minute}`
              const sel      = ds === selDate
              const isToday  = ds === todayStr
              const disabled = !!(minDateTime && dt < minDateTime.slice(0, 16))
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  className={[
                    'dtp__day',
                    !c.cur   ? 'dtp__day--other'    : '',
                    sel      ? 'dtp__day--sel'       : '',
                    isToday && !sel ? 'dtp__day--today' : '',
                    disabled ? 'dtp__day--disabled'  : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => handleDayClick(c.y, c.mo, c.d)}
                >{c.d}</button>
              )
            })}
          </div>

          <div className="dtp__time">
            <input
              type="number"
              className="dtp__time-inp"
              value={Number(hour)}
              min={0} max={23}
              onChange={e => handleHour(e.target.value)}
              onBlur={e  => handleHour(e.target.value)}
            />
            <span className="dtp__colon">:</span>
            <input
              type="number"
              className="dtp__time-inp"
              value={Number(minute)}
              min={0} max={59}
              onChange={e => handleMinute(e.target.value)}
              onBlur={e  => handleMinute(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
