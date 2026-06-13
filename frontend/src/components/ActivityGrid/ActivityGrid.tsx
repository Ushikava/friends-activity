import { motion } from 'framer-motion'
import { useLang } from '../../i18n/LangContext'
import { sectionVariants } from '../../utils/animations'
import type { ActivityData } from '../../types'
import './ActivityGrid.css'

const WEEKS = 52
const CELL = 13
const GAP = 3
const STEP = CELL + GAP
const DAY_LABEL_WIDTH = 26

interface DayCell {
  date: Date
  count: number
}

type WeekRow = (DayCell | null)[]

interface MonthLabel {
  col: number
  text: string
}

function dateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfWeek(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day))
  date.setHours(0, 0, 0, 0)
  return date
}

function buildGrid(activity: ActivityData): WeekRow[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const start = startOfWeek(new Date(today.getTime() - (WEEKS - 1) * 7 * 86400000))
  const weeks: WeekRow[] = []
  const cur = new Date(start)

  while (cur <= today) {
    const week: WeekRow = []
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

function getMonthLabels(weeks: WeekRow[], months: string[]): MonthLabel[] {
  return weeks.reduce<MonthLabel[]>((acc, week, i) => {
    const day = week.find(Boolean) as DayCell | undefined
    if (!day) return acc
    const m = day.date.getMonth()
    const prev = weeks[i - 1]?.find(Boolean) as DayCell | undefined
    if (!prev || prev.date.getMonth() !== m) {
      const text = m === 0
        ? `${months[m]} ${day.date.getFullYear()}`
        : months[m]
      acc.push({ col: i, text })
    }
    return acc
  }, [])
}

function getColor(count: number): string {
  if (count === 0) return 'var(--activity-0)'
  if (count === 1) return 'var(--activity-1)'
  if (count <= 3) return 'var(--activity-2)'
  if (count <= 5) return 'var(--activity-3)'
  return 'var(--activity-4)'
}

function formatDate(d: Date, lang: string): string {
  return d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

interface Props {
  activity: ActivityData
}

export default function ActivityGrid({ activity }: Props) {
  const { t, tRaw, lang } = useLang()
  const months = tRaw('activity.months') as string[]
  const days = tRaw('activity.days') as string[]
  const plural = tRaw('activity.plural') as (n: number) => string

  const weeks = buildGrid(activity)
  const monthLabels = getMonthLabels(weeks, months)

  return (
    <motion.div className="activity" variants={sectionVariants} initial="hidden" animate="show">
      <h2 className="home-section__title" style={{ marginBottom: 12 }}>{t('activity.title') as string}</h2>

      <div className="activity__wrap">
        <div className="activity__months" style={{ paddingLeft: DAY_LABEL_WIDTH + GAP * 2 }}>
          {monthLabels.map(({ col, text }) => (
            <span key={col} className="activity__month" style={{ left: col * STEP }}>
              {text}
            </span>
          ))}
        </div>

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

        <div className="activity__legend">
          <span>{t('activity.less') as string}</span>
          {[0, 1, 2, 4, 6].map((count, i) => (
            <div key={i} className="activity__cell" style={{ background: getColor(count) }} />
          ))}
          <span>{t('activity.more') as string}</span>
        </div>
      </div>
    </motion.div>
  )
}
