import { motion } from 'framer-motion'
import { useLang } from '../../i18n/LangContext'
import { sectionVariants } from '../../utils/animations'
import './ActivityGrid.css'

const WEEKS = 52
const CELL = 13
const GAP = 3
const STEP = CELL + GAP
const DAY_LABEL_WIDTH = 26

function dateKey(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfWeek(d) {
  const date = new Date(d)
  const day = date.getDay()
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day))
  date.setHours(0, 0, 0, 0)
  return date
}

function buildGrid(activity) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const start = startOfWeek(new Date(today.getTime() - (WEEKS - 1) * 7 * 86400000))
  const weeks = []
  const cur = new Date(start)

  while (cur <= today) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const cell = new Date(cur)
      week.push(cell <= today
        ? { date: cell, count: activity[dateKey(cell)] ?? 0 }
        : null
      )
      cur.setDate(cur.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

function getMonthLabels(weeks, months) {
  return weeks.reduce((acc, week, i) => {
    const day = week.find(Boolean)
    if (!day) return acc
    const m = day.date.getMonth()
    const prev = weeks[i - 1]?.find(Boolean)
    if (!prev || prev.date.getMonth() !== m) {
      const text = m === 0
        ? `${months[m]} ${day.date.getFullYear()}`
        : months[m]
      acc.push({ col: i, text })
    }
    return acc
  }, [])
}

function getColor(count) {
  if (count === 0) return 'var(--activity-0)'
  if (count === 1) return 'var(--activity-1)'
  if (count <= 3) return 'var(--activity-2)'
  if (count <= 5) return 'var(--activity-3)'
  return 'var(--activity-4)'
}

function formatDate(d, lang) {
  return d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function ActivityGrid({ activity }) {
  const { t, lang } = useLang()
  const months = t('activity.months')
  const days = t('activity.days')
  const plural = t('activity.plural')

  const weeks = buildGrid(activity)
  const monthLabels = getMonthLabels(weeks, months)

  return (
    <motion.div className="activity" variants={sectionVariants} initial="hidden" animate="show">
      <h2 className="home-section__title" style={{ marginBottom: 12 }}>{t('activity.title')}</h2>

      <div className="activity__wrap">
        {/* Month labels */}
        <div className="activity__months" style={{ paddingLeft: DAY_LABEL_WIDTH + GAP * 2 }}>
          {monthLabels.map(({ col, text }) => (
            <span key={col} className="activity__month" style={{ left: col * STEP }}>
              {text}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div className="activity__grid">
          <div className="activity__days">
            {days.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </div>

          <div className="activity__weeks">
            {weeks.map((week, wi) => (
              <div key={wi} className="activity__week">
                {week.map((day, di) =>
                  day ? (
                    <div
                      key={di}
                      className="activity__cell"
                      style={{ background: getColor(day.count) }}
                      title={day.count > 0
                        ? `${formatDate(day.date, lang)}: ${plural(day.count)}`
                        : formatDate(day.date, lang)
                      }
                    />
                  ) : (
                    <div key={di} className="activity__cell activity__cell--future" />
                  )
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="activity__legend">
          <span>{t('activity.less')}</span>
          {[0, 1, 2, 4, 6].map((count, i) => (
            <div key={i} className="activity__cell" style={{ background: getColor(count) }} />
          ))}
          <span>{t('activity.more')}</span>
        </div>
      </div>
    </motion.div>
  )
}
