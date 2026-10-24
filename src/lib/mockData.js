import {
  DEMO_PASSWORD,
  HOSTELS,
  LIKELIHOOD_OPTIONS,
  MEAL_TYPES,
  PRE_MEAL_REASONS,
} from './constants'
import { addDays, getWeekStart, toKolkataDateString } from './timezone'

const DISH_BANK = {
  Breakfast: [
    ['Aloo Paratha', 'Curd', 'Tea'],
    ['Poha', 'Boiled Eggs', 'Banana'],
    ['Idli', 'Sambar', 'Coconut Chutney'],
    ['Bread Butter', 'Omelette', 'Milk'],
    ['Upma', 'Sprouts', 'Coffee'],
    ['Methi Thepla', 'Pickle', 'Tea'],
    ['Veg Cutlet', 'Toast', 'Tea'],
  ],
  Lunch: [
    ['Dal Tadka', 'Jeera Rice', 'Mixed Veg', 'Roti', 'Salad'],
    ['Rajma', 'Steamed Rice', 'Aloo Gobi', 'Roti', 'Curd'],
    ['Chole', 'Jeera Rice', 'Bhindi Fry', 'Roti', 'Salad'],
    ['Dal Fry', 'Veg Pulao', 'Paneer Bhurji', 'Roti', 'Raita'],
    ['Sambar', 'Rice', 'Cabbage Sabzi', 'Roti', 'Curd'],
    ['Kadhi Pakora', 'Rice', 'Aloo Matar', 'Roti', 'Salad'],
    ['Dal Makhani', 'Rice', 'Seasonal Veg', 'Roti', 'Boondi Raita'],
  ],
  Dinner: [
    ['Paneer Butter Masala', 'Rice', 'Chapati', 'Dal Fry'],
    ['Veg Biryani', 'Raita', 'Mirchi ka Salan', 'Gulab Jamun'],
    ['Palak Paneer', 'Roti', 'Jeera Rice', 'Dal Tadka'],
    ['Matar Mushroom', 'Rice', 'Chapati', 'Tomato Soup'],
    ['Veg Kofta', 'Roti', 'Rice', 'Dal Tadka'],
    ['Chana Masala', 'Rice', 'Chapati', 'Kheer'],
    ['Mix Veg Curry', 'Roti', 'Rice', 'Dal Fry'],
  ],
}

function id(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function seeded(seed) {
  let value = seed
  return () => {
    value = (value * 16807) % 2147483647
    return value / 2147483647
  }
}

function hashSeed(text) {
  return text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 1)
}

export function createEmptyState() {
  const users = []
  HOSTELS.forEach((hostel) => {
    const slug = hostel.name.split(' ')[0].toLowerCase()
    users.push({
      id: `u-admin-${hostel.id}`,
      email: `admin.${slug}@iitr.ac.in`,
      password: DEMO_PASSWORD,
      role: 'admin',
      hostel_id: hostel.id,
      name: `${hostel.name} Mess Admin`,
    })
    users.push({
      id: `u-student-${hostel.id}`,
      email: `student.${slug}@iitr.ac.in`,
      password: DEMO_PASSWORD,
      role: 'student',
      hostel_id: hostel.id,
      name: `${hostel.name} Student`,
    })
    for (let i = 1; i <= 18; i += 1) {
      users.push({
        id: `u-sim-${hostel.id}-${i}`,
        email: `sim${i}.${slug}@iitr.ac.in`,
        password: DEMO_PASSWORD,
        role: 'student',
        hostel_id: hostel.id,
        name: `Simulated Student ${i}`,
        simulated: true,
      })
    }
  })

  return {
    hostels: HOSTELS,
    users,
    weeklyMenus: [],
    menuVersions: [],
    menuVersionHistory: [],
    preMealFeedback: [],
    postMealKioskFeedback: [],
    mealWasteLogs: [],
  }
}

function buildWeekMenu(state, hostelId, weekStart, status, seedBase) {
  const menuId = `menu-${hostelId}-${weekStart}`
  state.weeklyMenus.push({
    id: menuId,
    hostel_id: hostelId,
    week_start_date: weekStart,
    status,
  })

  MEAL_TYPES.forEach((mealType) => {
    for (let day = 0; day < 7; day += 1) {
      const date = addDays(weekStart, day)
      const dishes = DISH_BANK[mealType][day]
      const versionId = `mv-${hostelId}-${date}-${mealType}`
      state.menuVersions.push({
        id: versionId,
        menu_id: menuId,
        date,
        meal_type: mealType,
        dishes: [...dishes],
        is_locked: false,
      })
      state.menuVersionHistory.push({
        id: id('hist'),
        menu_version_id: versionId,
        dishes: [...dishes],
        changed_at: `${date}T05:00:00+05:30`,
        changed_by: `u-admin-${hostelId}`,
      })

      const rand = seeded(seedBase + hashSeed(`${hostelId}${date}${mealType}`))
      if (status !== 'Draft' && rand() > 0.15) {
        seedPreMeal(state, hostelId, versionId, dishes, rand)
      }
      if (status === 'Completed' || (status === 'Published' && rand() > 0.55)) {
        seedKioskAndWaste(state, hostelId, date, mealType, dishes, rand)
      }
    }
  })
}

function seedPreMeal(state, hostelId, versionId, dishes, rand) {
  const students = state.users.filter(
    (user) => user.hostel_id === hostelId && user.role === 'student',
  )
  students.forEach((student, index) => {
    if (rand() < 0.28 && index > 1) return
    dishes.forEach((dish) => {
      if (rand() < 0.12) return
      const spicyBias = dish.toLowerCase().includes('paneer') || dish.toLowerCase().includes('chole')
      const ratingBase = spicyBias ? 3.1 : 3.8
      const rating = Math.min(5, Math.max(1, Math.round(ratingBase + (rand() - 0.5) * 3)))
      const likelihood =
        rating <= 2
          ? LIKELIHOOD_OPTIONS[3 + Math.floor(rand() * 2)]
          : LIKELIHOOD_OPTIONS[Math.floor(rand() * 3)]
      const reasons = []
      if (rating <= 2) {
        if (spicyBias) reasons.push('Too spicy')
        else reasons.push(PRE_MEAL_REASONS[Math.floor(rand() * 4)])
      } else if (rand() > 0.8) {
        reasons.push(PRE_MEAL_REASONS[Math.floor(rand() * PRE_MEAL_REASONS.length)])
      }
      state.preMealFeedback.push({
        id: id('pre'),
        student_id: student.id,
        menu_version_id: versionId,
        dish_name: dish,
        rating,
        likelihood_to_eat: likelihood,
        reasons,
      })
    })
  })
}

function seedKioskAndWaste(state, hostelId, date, mealType, dishes, rand) {
  const count = 18 + Math.floor(rand() * 22)
  for (let i = 0; i < count; i += 1) {
    const leftover = rand() > 0.62
    const issue = leftover
      ? ['Too Spicy', 'Undercooked', 'Bad Taste / Stale', 'Portion Too Big', 'Not Hungry / Rush', 'Other Reason'][
          Math.floor(rand() * 6)
        ]
      : null
    state.postMealKioskFeedback.push({
      id: id('kiosk'),
      hostel_id: hostelId,
      date,
      meal_type: mealType,
      dish_name: leftover ? dishes[Math.floor(rand() * dishes.length)] : dishes[0],
      issue,
      status: leftover ? 'Leftover' : 'Clean Plate',
    })
  }

  const includeWaste = rand() > 0.22
  if (includeWaste) {
    const leftoverShare =
      state.postMealKioskFeedback.filter(
        (row) => row.hostel_id === hostelId && row.date === date && row.meal_type === mealType && row.status === 'Leftover',
      ).length / count
    state.mealWasteLogs.push({
      id: id('waste'),
      hostel_id: hostelId,
      date,
      meal_type: mealType,
      actual_waste_kg: Number((8 + leftoverShare * 24 + rand() * 4).toFixed(1)),
    })
  }
}

export function generateDemoDataset(now = new Date()) {
  const state = createEmptyState()
  const thisWeek = getWeekStart(now)
  const lastWeek = addDays(thisWeek, -7)
  const twoWeeksAgo = addDays(thisWeek, -14)
  const today = toKolkataDateString(now)

  HOSTELS.forEach((hostel, index) => {
    buildWeekMenu(state, hostel.id, twoWeeksAgo, 'Completed', 1100 + index * 17)
    buildWeekMenu(state, hostel.id, lastWeek, 'Completed', 2200 + index * 23)
    buildWeekMenu(state, hostel.id, thisWeek, 'Published', 3300 + index * 29)

    if (index === 0) {
      const nextWeek = addDays(thisWeek, 7)
      buildWeekMenu(state, hostel.id, nextWeek, 'Draft', 4400)
    }
  })

  state.menuVersions.forEach((version) => {
    if (version.date < today) version.is_locked = true
  })

  return state
}

export function simulateIncomingForecast(state, hostelId, menuVersionId) {
  const version = state.menuVersions.find((item) => item.id === menuVersionId)
  if (!version) return state
  const students = state.users.filter(
    (user) => user.hostel_id === hostelId && user.role === 'student' && user.simulated,
  )
  const rand = seeded(Date.now() % 2147483647)
  students.slice(0, 8).forEach((student) => {
    version.dishes.forEach((dish) => {
      const exists = state.preMealFeedback.some(
        (row) =>
          row.student_id === student.id &&
          row.menu_version_id === menuVersionId &&
          row.dish_name === dish,
      )
      if (exists) return
      state.preMealFeedback.push({
        id: id('pre'),
        student_id: student.id,
        menu_version_id: menuVersionId,
        dish_name: dish,
        rating: 1 + Math.floor(rand() * 5),
        likelihood_to_eat: LIKELIHOOD_OPTIONS[Math.floor(rand() * LIKELIHOOD_OPTIONS.length)],
        reasons: rand() > 0.6 ? [PRE_MEAL_REASONS[Math.floor(rand() * 4)]] : [],
      })
    })
  })
  return state
}
