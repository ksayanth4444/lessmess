export const TIMEZONE = 'Asia/Kolkata'

export const HOSTELS = [
  { id: 'h-rk', name: 'Radhakrishna Bhawan' },
  { id: 'h-gb', name: 'Govind Bhawan' },
  { id: 'h-kb', name: 'Kasturba Bhawan' },
  { id: 'h-sb', name: 'Sarojini Bhawan' },
  { id: 'h-rb', name: 'Rajiv Bhawan' },
]

export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner']

export const MEAL_START_TIMES = {
  Breakfast: { hour: 7, minute: 30, label: '07:30' },
  Lunch: { hour: 12, minute: 30, label: '12:30' },
  Dinner: { hour: 19, minute: 30, label: '19:30' },
}

export const MENU_STATUSES = ['Draft', 'Published', 'Completed']

export const LIKELIHOOD_OPTIONS = [
  'Definitely eat',
  'Probably eat',
  'Unsure',
  'Probably skip',
  'Definitely skip',
]

export const SKIP_LIKELIHOODS = ['Probably skip', 'Definitely skip']

export const PRE_MEAL_REASONS = [
  'Too spicy',
  'Too bland',
  'Portion too large',
  'Dietary preference',
  'Do not like this dish',
  'Health / fitness',
  'Other',
]

export const KIOSK_ISSUES = [
  { id: 'too_spicy', label: 'Too Spicy', icon: 'Flame' },
  { id: 'undercooked', label: 'Undercooked', icon: 'Thermometer' },
  { id: 'stale', label: 'Bad Taste / Stale', icon: 'Ban' },
  { id: 'portion', label: 'Portion Too Big', icon: 'Maximize2' },
  { id: 'rush', label: 'Not Hungry / Rush', icon: 'Timer' },
  { id: 'other', label: 'Other Reason', icon: 'HelpCircle' },
]

export const KIOSK_STATUS = {
  CLEAN: 'Clean Plate',
  LEFTOVER: 'Leftover',
}

export const DEMO_PASSWORD = 'demo123'

export const MIN_HISTORY_FOR_KG = 3
export const MIN_RESPONSES_FOR_RISK = 1

export const RECOMMENDATION_MAP = {
  'Too spicy': 'Review spice level before the next service of this dish.',
  'Too bland': 'Increase seasoning or add a condiment station for this dish.',
  'Portion too large': 'Consider a smaller default portion with optional seconds.',
  'Dietary preference': 'Offer a clearly labelled alternative for common dietary needs.',
  'Do not like this dish': 'Consider swapping this dish on a future cycle.',
  'Health / fitness': 'Pair this item with a lighter option on the same meal.',
  Other: 'Collect qualitative notes from mess staff after service.',
  'Too Spicy': 'Review spice level; several plates were returned for heat.',
  Undercooked: 'Check cook time and holding temperature at service.',
  'Bad Taste / Stale': 'Review batch timing and holding so food is served fresh.',
  'Portion Too Big': 'Reduce plated portion size for this item.',
  'Not Hungry / Rush': 'Consider a grab-and-go option during peak class hours.',
  'Other Reason': 'Ask mess attendants to note uncategorised leftover reasons.',
}
