import { generateDemoDataset, simulateIncomingForecast } from './mockData'
import { isMealLocked, isWeekCompleted, resolveMenuStatus } from './timezone'

const STORAGE_KEY = 'lessmess-db-v1'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function loadRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return generateDemoDataset()
    return JSON.parse(raw)
  } catch {
    return generateDemoDataset()
  }
}

function persist(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  return state
}

function applyLocks(state, now = new Date()) {
  state.menuVersions.forEach((version) => {
    if (isMealLocked(version.date, version.meal_type, now)) {
      version.is_locked = true
    }
  })
  state.weeklyMenus.forEach((menu) => {
    if (menu.status === 'Published' && isWeekCompleted(menu.week_start_date, now)) {
      menu.status = 'Completed'
    } else if (menu.status !== 'Draft') {
      menu.status = resolveMenuStatus(menu, now)
    }
  })
  return state
}

export function loadState() {
  return applyLocks(loadRaw())
}

export function resetDemoData() {
  return persist(applyLocks(generateDemoDataset()))
}

export function saveState(state) {
  return persist(applyLocks(state))
}

export function scopedMenus(state, hostelId) {
  return state.weeklyMenus.filter((menu) => menu.hostel_id === hostelId)
}

export function versionsForMenu(state, menuId) {
  return state.menuVersions.filter((version) => version.menu_id === menuId)
}

export function versionsForHostel(state, hostelId) {
  const menuIds = new Set(scopedMenus(state, hostelId).map((menu) => menu.id))
  return state.menuVersions.filter((version) => menuIds.has(version.menu_id))
}

export function updateMenuDishes(state, versionId, dishes, userId) {
  const next = clone(state)
  const version = next.menuVersions.find((item) => item.id === versionId)
  if (!version) throw new Error('Menu version not found')
  if (isMealLocked(version.date, version.meal_type) || version.is_locked) {
    throw new Error('This meal is locked and can no longer be changed.')
  }
  next.menuVersionHistory.push({
    id: `hist-${Date.now()}`,
    menu_version_id: versionId,
    dishes: [...version.dishes],
    changed_at: new Date().toISOString(),
    changed_by: userId,
  })
  version.dishes = dishes
  return saveState(next)
}

export function setMenuStatus(state, menuId, status) {
  const next = clone(state)
  const menu = next.weeklyMenus.find((item) => item.id === menuId)
  if (!menu) throw new Error('Menu not found')
  menu.status = status
  return saveState(next)
}

export function upsertPreMealFeedback(state, payload) {
  const next = clone(state)
  const version = next.menuVersions.find((item) => item.id === payload.menu_version_id)
  if (!version) throw new Error('Meal not found')
  if (version.is_locked || isMealLocked(version.date, version.meal_type)) {
    throw new Error('This meal has started and is locked for pre-meal feedback.')
  }
  const existing = next.preMealFeedback.find(
    (row) =>
      row.student_id === payload.student_id &&
      row.menu_version_id === payload.menu_version_id &&
      row.dish_name === payload.dish_name,
  )
  if (existing) {
    existing.rating = payload.rating
    existing.likelihood_to_eat = payload.likelihood_to_eat
    existing.reasons = payload.reasons || []
  } else {
    next.preMealFeedback.push({
      id: `pre-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...payload,
    })
  }
  return saveState(next)
}

export function addKioskFeedback(state, payload) {
  const next = clone(state)
  next.postMealKioskFeedback.push({
    id: `kiosk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ...payload,
  })
  return saveState(next)
}

export function upsertWasteLog(state, payload) {
  const next = clone(state)
  const existing = next.mealWasteLogs.find(
    (row) =>
      row.hostel_id === payload.hostel_id &&
      row.date === payload.date &&
      row.meal_type === payload.meal_type,
  )
  if (existing) {
    existing.actual_waste_kg = payload.actual_waste_kg
  } else {
    next.mealWasteLogs.push({
      id: `waste-${Date.now()}`,
      ...payload,
    })
  }
  return saveState(next)
}

export function simulateForecast(state, hostelId, menuVersionId) {
  return saveState(simulateIncomingForecast(clone(state), hostelId, menuVersionId))
}

export { clone }
