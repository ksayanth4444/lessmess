import { MEAL_START_TIMES, TIMEZONE } from './constants'

function kolkataFormatter(options) {
  return new Intl.DateTimeFormat('en-IN', { timeZone: TIMEZONE, ...options })
}

export function toKolkataDateString(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function getKolkataParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
    hour12: false,
  }).formatToParts(date)

  const get = (type) => parts.find((part) => part.type === type)?.value
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    second: Number(get('second')),
    weekday: get('weekday'),
    dateString: `${get('year')}-${get('month')}-${get('day')}`,
  }
}

export function formatKolkataDateTime(date = new Date()) {
  return kolkataFormatter({
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

export function formatKolkataDate(dateString) {
  const date = parseKolkataDate(dateString)
  return kolkataFormatter({
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function parseKolkataDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
}

export function addDays(dateString, days) {
  const date = parseKolkataDate(dateString)
  date.setUTCDate(date.getUTCDate() + days)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getWeekStart(date = new Date()) {
  const parts = getKolkataParts(date)
  const weekdayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(
    parts.weekday,
  )
  const offset = weekdayIndex === 0 ? -6 : 1 - weekdayIndex
  return addDays(parts.dateString, offset)
}

export function getWeekDates(weekStart) {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
}

export function compareDates(a, b) {
  if (a === b) return 0
  return a < b ? -1 : 1
}

export function mealHasStarted(dateString, mealType, now = new Date()) {
  const nowParts = getKolkataParts(now)
  const cmp = compareDates(dateString, nowParts.dateString)
  if (cmp < 0) return true
  if (cmp > 0) return false
  const start = MEAL_START_TIMES[mealType]
  const nowMinutes = nowParts.hour * 60 + nowParts.minute
  const startMinutes = start.hour * 60 + start.minute
  return nowMinutes >= startMinutes
}

export function isMealLocked(dateString, mealType, now = new Date()) {
  return mealHasStarted(dateString, mealType, now)
}

export function isWeekCompleted(weekStart, now = new Date()) {
  const weekEnd = addDays(weekStart, 6)
  const nowDate = getKolkataParts(now).dateString
  if (compareDates(nowDate, weekEnd) < 0) return false
  if (compareDates(nowDate, weekEnd) > 0) return true
  return mealHasStarted(weekEnd, 'Dinner', now)
}

export function resolveMenuStatus(menu, now = new Date()) {
  if (menu.status === 'Draft') return 'Draft'
  if (isWeekCompleted(menu.week_start_date, now)) return 'Completed'
  return 'Published'
}
