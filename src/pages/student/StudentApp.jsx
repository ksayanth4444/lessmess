import {
  ArrowLeft,
  ArrowRight,
  Ban,
  CalendarClock,
  Check,
  Disc,
  Flame,
  HelpCircle,
  Leaf,
  LogOut,
  Maximize2,
  Star,
  Thermometer,
  Timer,
  Utensils,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StarScale from '../../components/StarScale'
import TimezoneBanner from '../../components/TimezoneBanner'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import {
  HOSTELS,
  LIKELIHOOD_OPTIONS,
  MEAL_START_TIMES,
  MEAL_TYPES,
  PRE_MEAL_REASONS,
} from '../../lib/constants'
import { versionsForHostel } from '../../lib/dataStore'
import { formatKolkataDate, getKolkataParts, isMealLocked, mealHasStarted, toKolkataDateString } from '../../lib/timezone'

// --- LOCAL KIOSK ISSUES ---
const REVIEW_ISSUES = [
  { id: 'spicy', label: 'Too Spicy', icon: Flame },
  { id: 'under', label: 'Undercooked', icon: Thermometer },
  { id: 'bad', label: 'Bad Taste / Stale', icon: Ban },
  { id: 'fav', label: 'Not my favorite', icon: Maximize2 },
  { id: 'rush', label: 'Not Hungry / Rush', icon: Timer },
  { id: 'other', label: 'Other Reason', icon: HelpCircle }
]

// --- HELPERS ---
function currentMeal(now = new Date()) {
  const parts = getKolkataParts(now)
  const minutes = parts.hour * 60 + parts.minute
  if (minutes >= 19 * 60 + 30) return { date: parts.dateString, meal_type: 'Dinner' }
  if (minutes >= 12 * 60 + 30) return { date: parts.dateString, meal_type: 'Lunch' }
  if (minutes >= 7 * 60 + 30) return { date: parts.dateString, meal_type: 'Breakfast' }
  return { date: parts.dateString, meal_type: 'Breakfast' }
}

// --- COMPONENTS ---
function DishForm({ dish, existing, disabled, onSave }) {
  const [rating, setRating] = useState(existing?.rating || 0)
  const [likelihood, setLikelihood] = useState(existing?.likelihood_to_eat || '')
  const [reasons, setReasons] = useState(existing?.reasons || [])
  const [saved, setSaved] = useState(false)

  const toggleReason = (reason) => {
    setReasons((current) =>
      current.includes(reason) ? current.filter((item) => item !== reason) : [...current, reason],
    )
  }

  const submit = (event) => {
    event.preventDefault()
    if (!rating || !likelihood) return
    onSave({ rating, likelihood_to_eat: likelihood, reasons })
    setSaved(true)
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-200 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="font-semibold text-slate-900">{dish}</h3>
        {existing || saved ? <Badge tone="Published">Saved</Badge> : null}
      </div>
      <p className="text-xs font-medium text-slate-500">How much do you like it?</p>
      <StarScale value={rating} onChange={setRating} size="lg" />
      <p className="mt-4 text-xs font-medium text-slate-500">Likelihood to eat</p>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {LIKELIHOOD_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            disabled={disabled}
            onClick={() => setLikelihood(option)}
            className={`rounded-lg border px-3 py-2 text-left text-sm ${
              likelihood === option
                ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                : 'border-slate-200 bg-white'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      <p className="mt-4 text-xs font-medium text-slate-500">Optional reasons</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {PRE_MEAL_REASONS.map((reason) => (
          <button
            key={reason}
            type="button"
            disabled={disabled}
            onClick={() => toggleReason(reason)}
            className={`rounded-full border px-3 py-1 text-xs ${
              reasons.includes(reason)
                ? 'border-emerald-700 bg-emerald-50 text-emerald-800'
                : 'border-slate-200'
            }`}
          >
            {reason}
          </button>
        ))}
      </div>
      <button
        type="submit"
        disabled={disabled || !rating || !likelihood}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        <Check className="h-4 w-4" /> Save preference
      </button>
    </form>
  )
}

function PostMealKiosk({ hostelId, onBack }) {
  const { state, submitKiosk } = useData()
  const [step, setStep] = useState(1)
  const [status, setStatus] = useState('')
  const [seconds, setSeconds] = useState(5)

  const meal = currentMeal()
  const version = useMemo(() => {
    const versions = versionsForHostel(state, hostelId)
    return (
      versions.find((item) => item.date === meal.date && item.meal_type === meal.meal_type) ||
      versions.find((item) => isMealLocked(item.date, item.meal_type))
    )
  }, [state, hostelId, meal.date, meal.meal_type])

  const dishes = version?.dishes || []
  
  // NEW: State for tracking issues per specific dish
  const [activeDish, setActiveDish] = useState(dishes[0] || '')
  const [dishFeedback, setDishFeedback] = useState({}) // Format: { 'Rice': ['Too Spicy', 'Undercooked'] }

  useEffect(() => {
    if (dishes.length > 0 && !activeDish) setActiveDish(dishes[0])
  }, [dishes, activeDish])

  useEffect(() => {
    if (step !== 3) return undefined
    setSeconds(5)
    const timer = setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          clearInterval(timer)
          onBack()
          return 5
        }
        return value - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [step, onBack])

  const toggleIssue = (issueLabel) => {
    if (!activeDish) return
    setDishFeedback((prev) => {
      const currentIssues = prev[activeDish] || []
      const newIssues = currentIssues.includes(issueLabel)
        ? currentIssues.filter((i) => i !== issueLabel)
        : [...currentIssues, issueLabel]
      return { ...prev, [activeDish]: newIssues }
    })
  }

  const handleStatusSelect = (selectedStatus) => {
    setStatus(selectedStatus)
    setStep(2)
  }

  const submit = () => {
    let submittedAny = false
    
    // Submit a specific record for each dish that has feedback
    Object.entries(dishFeedback).forEach(([dishName, issuesArray]) => {
      if (issuesArray.length > 0) {
        submitKiosk({
          hostel_id: hostelId,
          date: version?.date || meal.date,
          meal_type: version?.meal_type || meal.meal_type,
          dish_name: dishName,
          issue: issuesArray.join(', '),
          status,
        })
        submittedAny = true
      }
    })

    // Fallback: If they clicked Leftover but didn't pick any specific reasons, submit a generic record
    if (!submittedAny && status === 'Leftover') {
      submitKiosk({
        hostel_id: hostelId,
        date: version?.date || meal.date,
        meal_type: version?.meal_type || meal.meal_type,
        dish_name: null,
        issue: null,
        status,
      })
    }

    setStep(3)
  }

  const chooseClean = () => {
    setStatus('Clean Plate')
    submitKiosk({
      hostel_id: hostelId,
      date: version?.date || meal.date,
      meal_type: version?.meal_type || meal.meal_type,
      dish_name: null,
      issue: null,
      status: 'Clean Plate',
    })
    setStep(3)
  }

  // Check if any feedback has been provided across all dishes to enable the submit button
  const hasAnyFeedback = Object.values(dishFeedback).some(issuesArray => issuesArray.length > 0)

  return (
    <Card className="flex flex-col overflow-hidden p-6 sm:p-10">
      {step === 1 && (
        <div className="flex flex-col">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            How much of your meal did you finish?
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={chooseClean}
              className="flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-3xl bg-emerald-700 text-white shadow-sm transition hover:bg-emerald-800"
            >
              <Star className="h-12 w-12 fill-white" />
              <span className="text-xl font-semibold">Clean Plate!</span>
            </button>
            <button
              type="button"
              onClick={() => handleStatusSelect('Leftover')}
              className="flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-3xl border border-violet-200 bg-violet-50 text-violet-900 shadow-sm transition hover:bg-violet-100"
            >
              <Disc className="h-12 w-12" />
              <span className="text-xl font-semibold">Leftovers Remaining</span>
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Which item are you reviewing?
          </h2>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {dishes.map((item) => {
              const hasFeedbackForThisDish = dishFeedback[item] && dishFeedback[item].length > 0
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setActiveDish(item)}
                  className={`flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition-all ${
                    activeDish === item
                      ? 'border-emerald-700 bg-emerald-700 text-white shadow-md scale-105'
                      : hasFeedbackForThisDish 
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-900' 
                        : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {item}
                  {hasFeedbackForThisDish && <Check className="h-4 w-4" />}
                </button>
              )
            })}
          </div>

          {activeDish && (
            <div className="mt-10 animate-in fade-in slide-in-from-bottom-4">
              <div className="border-t border-slate-100 pt-8">
                <h3 className="text-center text-lg font-semibold text-slate-900">
                  Any specific feedback for {activeDish}? <span className="text-sm font-normal text-slate-500">(Select all that apply)</span>
                </h3>
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {REVIEW_ISSUES.map((item) => {
                    const Icon = item.icon
                    const active = (dishFeedback[activeDish] || []).includes(item.label)
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleIssue(item.label)}
                        className={`flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-2xl border bg-white p-3 text-center shadow-sm transition-all ${
                          active ? 'border-emerald-700 ring-2 ring-emerald-700/20 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        <Icon className={`h-6 w-6 ${active ? 'text-emerald-800' : 'text-slate-400'}`} />
                        <span className={`text-sm font-semibold ${active ? 'text-emerald-900' : 'text-slate-700'}`}>
                          {item.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="mt-10 flex justify-between border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              type="button"
              disabled={!hasAnyFeedback}
              onClick={submit}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Feedback <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-700 text-white">
            <Leaf className="h-10 w-10" />
          </div>
          <h2 className="mt-6 text-3xl font-semibold text-slate-900">Thank You!</h2>
          <p className="mt-2 text-slate-500">Your feedback updates the kitchen's predictive model.</p>
          <p className="mt-6 flex items-center justify-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
            <Check className="h-4 w-4" /> Returning to dashboard in {seconds}s
          </p>
        </div>
      )}
    </Card>
  )
}

// --- MAIN PAGE ---
export default function StudentApp() {
  const { user, logout } = useAuth()
  const { state, submitPreMeal } = useData()
  const navigate = useNavigate()

  const [view, setView] = useState('home')
  const [hasSubmittedPostMeal, setHasSubmittedPostMeal] = useState(false)
  const hostel = HOSTELS.find((item) => item.id === user.hostel_id)
  const today = toKolkataDateString()

  const meals = useMemo(() => {
    const publishedMenuIds = new Set(
      state.weeklyMenus
        .filter((menu) => menu.hostel_id === user.hostel_id && menu.status !== 'Draft')
        .map((menu) => menu.id),
    )
    return versionsForHostel(state, user.hostel_id)
      .filter((version) => publishedMenuIds.has(version.menu_id) && version.date >= today)
      .sort((a, b) => {
        const dateCmp = a.date.localeCompare(b.date)
        if (dateCmp !== 0) return dateCmp
        return MEAL_TYPES.indexOf(a.meal_type) - MEAL_TYPES.indexOf(b.meal_type)
      })
  }, [state, user.hostel_id, today])

  const [openId, setOpenId] = useState('')

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-emerald-700">STUDENT APP</p>
              <h1 className="text-lg font-semibold">{hostel?.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TimezoneBanner />
            <button
              type="button"
              onClick={async () => {
                await logout()
                navigate('/login')
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {view === 'home' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            
            {hasSubmittedPostMeal ? (
               <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 p-6 shadow-sm">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-700 text-white">
                    <Check className="h-8 w-8" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Review Complete</h2>
                  <p className="mt-2 text-center text-sm text-slate-500">
                    Thank you for submitting your post-meal feedback for this session!
                  </p>
               </div>
            ) : (
              <button
                onClick={() => setView('post-meal')}
                className="group flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-emerald-700 hover:ring-1 hover:ring-emerald-700"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 transition-colors group-hover:bg-emerald-100">
                  <Utensils className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Post-Meal Review</h2>
                <p className="mt-2 text-center text-sm text-slate-500">
                  Log what you ate or left on your plate after your meal.
                </p>
              </button>
            )}

            <button
              onClick={() => setView('pre-meal')}
              className="group flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-emerald-700 hover:ring-1 hover:ring-emerald-700"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 transition-colors group-hover:bg-emerald-100">
                <CalendarClock className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Pre-Meal Forecast</h2>
              <p className="mt-2 text-center text-sm text-slate-500">
                Rate upcoming dishes to help the kitchen predict portions.
              </p>
            </button>
          </div>
        )}

        {view === 'pre-meal' && (
          <div className="space-y-4">
            <button
              onClick={() => setView('home')}
              className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-700"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </button>

            <Card className="p-4 text-sm text-slate-600">
              Rate dishes before the meal starts. An intention to skip is preference data only and is
              not counted as waste. Forms lock at meal start (
              {Object.entries(MEAL_START_TIMES)
                .map(([meal, time]) => `${meal} ${time.label}`)
                .join(' · ')}{' '}
              Asia/Kolkata).
            </Card>

            {meals.map((meal) => {
              const locked = meal.is_locked || isMealLocked(meal.date, meal.meal_type)
              const open = openId === meal.id
              return (
                <Card key={meal.id} className="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? '' : meal.id)}
                    className="flex w-full items-center justify-between px-4 py-4 text-left hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-xs text-slate-500">{formatKolkataDate(meal.date)}</p>
                      <h2 className="text-base font-semibold text-slate-900">{meal.meal_type}</h2>
                    </div>
                    <Badge tone={locked ? 'Locked' : 'Published'}>
                      {locked ? 'Locked' : 'Open'}
                    </Badge>
                  </button>
                  {open ? (
                    <div className="space-y-3 border-t border-slate-200 bg-slate-50/50 p-4">
                      {locked ? (
                        <p className="text-sm text-slate-600">
                          This meal has started and is locked for pre-meal ratings.
                        </p>
                      ) : null}
                      {meal.dishes.map((dish) => {
                        const existing = state.preMealFeedback.find(
                          (row) =>
                            row.student_id === user.id &&
                            row.menu_version_id === meal.id &&
                            row.dish_name === dish,
                        )
                        return (
                          <DishForm
                            key={dish}
                            dish={dish}
                            existing={existing}
                            disabled={locked}
                            onSave={(payload) =>
                              submitPreMeal({
                                student_id: user.id,
                                menu_version_id: meal.id,
                                dish_name: dish,
                                ...payload,
                              })
                            }
                          />
                        )
                      })}
                    </div>
                  ) : null}
                </Card>
              )
            })}
          </div>
        )}

        {view === 'post-meal' && (
          <div className="space-y-4">
            <button
              onClick={() => setView('home')}
              className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-700"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </button>
            <PostMealKiosk 
               hostelId={user.hostel_id} 
               onBack={() => {
                 setHasSubmittedPostMeal(true);
                 setView('home');
               }} 
            />
          </div>
        )}
      </main>
    </div>
  )
}