import {
  ArrowLeft,
  ArrowRight,
  Ban,
  Check,
  Disc,
  Flame,
  HelpCircle,
  Leaf,
  Maximize2,
  Star,
  Thermometer,
  Timer,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import TimezoneBanner from '../../components/TimezoneBanner'
import { useData } from '../../context/DataContext'
import { HOSTELS, KIOSK_ISSUES, MEAL_TYPES } from '../../lib/constants'
import { versionsForHostel } from '../../lib/dataStore'
import { getKolkataParts, isMealLocked, mealHasStarted } from '../../lib/timezone'

const ICONS = { Flame, Thermometer, Ban, Maximize2, Timer, HelpCircle }

function currentMeal(now = new Date()) {
  const parts = getKolkataParts(now)
  const minutes = parts.hour * 60 + parts.minute
  if (minutes >= 19 * 60 + 30) return { date: parts.dateString, meal_type: 'Dinner' }
  if (minutes >= 12 * 60 + 30) return { date: parts.dateString, meal_type: 'Lunch' }
  if (minutes >= 7 * 60 + 30) return { date: parts.dateString, meal_type: 'Breakfast' }
  return { date: parts.dateString, meal_type: 'Breakfast' }
}

export default function KioskFlow() {
  const { hostel_id } = useParams()
  const { state, submitKiosk } = useData()
  const hostel = HOSTELS.find((item) => item.id === hostel_id)
  const [step, setStep] = useState(1)
  const [status, setStatus] = useState('')
  const [issue, setIssue] = useState('')
  const [dish, setDish] = useState('')
  const [seconds, setSeconds] = useState(5)

  const meal = currentMeal()
  const version = useMemo(() => {
    const versions = versionsForHostel(state, hostel_id)
    return (
      versions.find(
        (item) => item.date === meal.date && item.meal_type === meal.meal_type,
      ) || versions.find((item) => isMealLocked(item.date, item.meal_type))
    )
  }, [state, hostel_id, meal.date, meal.meal_type])

  const dishes = version?.dishes || []

  useEffect(() => {
    if (step !== 3) return undefined
    setSeconds(5)
    const timer = setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          clearInterval(timer)
          setStep(1)
          setStatus('')
          setIssue('')
          setDish('')
          return 5
        }
        return value - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [step])

  if (!hostel) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700">
        Unknown hostel kiosk.
      </div>
    )
  }

  const submit = () => {
    submitKiosk({
      hostel_id,
      date: version?.date || meal.date,
      meal_type: version?.meal_type || meal.meal_type,
      dish_name: dish || dishes[0] || null,
      issue: status === 'Leftover' ? issue : null,
      status,
    })
    setStep(3)
  }

  const chooseClean = () => {
    setStatus('Clean Plate')
    submitKiosk({
      hostel_id,
      date: version?.date || meal.date,
      meal_type: version?.meal_type || meal.meal_type,
      dish_name: dishes[0] || null,
      issue: null,
      status: 'Clean Plate',
    })
    setStep(3)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-emerald-700">
              PLATE RETURN TOUCH KIOSK · {hostel.name.toUpperCase()}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Serving {version?.meal_type || meal.meal_type} · {version?.date || meal.date} · Asia/Kolkata
            </p>
          </div>
          <TimezoneBanner />
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-88px)] max-w-5xl flex-col px-6 py-8">
        {step === 1 ? (
          <div className="flex flex-1 flex-col">
            <h1 className="text-center text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
              How much of your meal did you finish?
            </h1>
            <div className="mt-10 grid flex-1 gap-6 md:grid-cols-2">
              <button
                type="button"
                onClick={chooseClean}
                className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-3xl bg-emerald-700 text-white shadow-sm transition hover:bg-emerald-800"
              >
                <Star className="h-16 w-16 fill-white" />
                <span className="text-3xl font-semibold">Clean Plate!</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatus('Leftover')
                  setStep(2)
                }}
                className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-3xl border border-violet-200 bg-violet-50 text-violet-900 shadow-sm transition hover:bg-violet-100"
              >
                <Disc className="h-16 w-16" />
                <span className="text-3xl font-semibold">Leftovers Remaining</span>
              </button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="flex flex-1 flex-col">
            <h1 className="text-center text-4xl font-semibold tracking-tight text-slate-900">
              What was the main reason?
            </h1>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
              {KIOSK_ISSUES.map((item) => {
                const Icon = ICONS[item.icon]
                const active = issue === item.label
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIssue(item.label)}
                    className={`flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-2xl border bg-white p-4 text-center shadow-sm ${
                      active ? 'border-emerald-700 ring-4 ring-emerald-700/15' : 'border-slate-200'
                    }`}
                  >
                    <Icon className="h-8 w-8 text-emerald-700" />
                    <span className="text-base font-semibold text-slate-900">{item.label}</span>
                  </button>
                )
              })}
            </div>
            <p className="mt-8 text-lg font-semibold text-slate-900">Which item had the most waste?</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {dishes.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDish(item)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium ${
                    dish === item
                      ? 'border-emerald-700 bg-emerald-700 text-white'
                      : 'border-slate-200 bg-white text-slate-800'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="mt-auto flex justify-between pt-8">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-medium"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                type="button"
                disabled={!issue || !dish}
                onClick={submit}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white disabled:opacity-50"
              >
                Submit Feedback <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-700 text-white">
              <Leaf className="h-12 w-12" />
            </div>
            <h1 className="mt-6 text-4xl font-semibold text-slate-900">
              Thank You for Helping IIT Roorkee!
            </h1>
            <p className="mt-3 flex items-center gap-2 text-slate-500">
              <Check className="h-4 w-4 text-emerald-700" /> Resetting in {seconds}s
            </p>
          </div>
        ) : null}

        <p className="mt-6 text-center text-xs text-slate-400">
          Anonymous kiosk · no sign-in · meals {MEAL_TYPES.filter((item) => mealHasStarted(meal.date, item) || item === meal.meal_type).join(', ')}
        </p>
      </main>
    </div>
  )
}
