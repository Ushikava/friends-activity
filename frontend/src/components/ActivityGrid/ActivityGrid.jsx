import './ActivityGrid.css'

const WEEKS = 52
const CELL = 13
const GAP = 3
const STEP = CELL + GAP
const DAY_LABEL_WIDTH = 26

const MONTHS_RU = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

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

function getMonthLabels(weeks) {
  return weeks.reduce((acc, week, i) => {
    const day = week.find(Boolean)
    if (!day) return acc
    const m = day.date.getMonth()
    const prev = weeks[i - 1]?.find(Boolean)
    if (!prev || prev.date.getMonth() !== m) {
      const text = m === 0
        ? `${MONTHS_RU[m]} ${day.date.getFullYear()}`
        : MONTHS_RU[m]
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

function plural(n) {
  if (n === 1) return '1 событие'
  if (n >= 2 && n <= 4) return `${n} события`
  return `${n} событий`
}

function formatDate(d) {
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ActivityGrid({ activity }) {
  const weeks = buildGrid(activity)
  const monthLabels = getMonthLabels(weeks)

  return (
    <div className="activity">
      <h2 className="home-section__title" style={{ marginBottom: 12 }}>Активность</h2>

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
            {['Пн', '', 'Ср', '', 'Пт', '', ''].map((label, i) => (
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
                      title={day.count > 0 ? `${formatDate(day.date)}: ${plural(day.count)}` : formatDate(day.date)}
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
          <span>меньше</span>
          {[0, 1, 2, 4, 6].map((count, i) => (
            <div key={i} className="activity__cell" style={{ background: getColor(count) }} />
          ))}
          <span>больше</span>
        </div>
      </div>
    </div>
  )
}
