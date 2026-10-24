import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Disc,
  Leaf,
  LogOut,
  RefreshCw,
  UtensilsCrossed,
  Wand2
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TimezoneBanner from '../../components/TimezoneBanner'
import Card from '../../components/ui/Card'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { HOSTELS, MEAL_TYPES } from '../../lib/constants'
import { versionsForHostel } from '../../lib/dataStore'

import ForecastPanel from './ForecastPanel'
import MenuPlanner from './MenuPlanner'

const TABS = [
  { id: 'menu', label: 'Weekly menus', icon: ClipboardList },
  { id: 'forecast', label: 'Pre-meal forecast', icon: BarChart3 },
  { id: 'learning', label: 'Learning loop', icon: UtensilsCrossed },
]

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const { state, resetDemo } = useData()
  const navigate = useNavigate()
  const [tab, setTab] = useState('menu')
  const hostel = HOSTELS.find((item) => item.id === user.hostel_id)

  // --- POST-MEAL ANALYTICS LOGIC ---
  const [selectedMealId, setSelectedMealId] = useState('')
  const [localMockData, setLocalMockData] = useState([]) // Stores our injected demo data

  const pastMeals = useMemo(() => {
    return versionsForHostel(state, user.hostel_id).sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date)
      if (dateCmp !== 0) return dateCmp
      return MEAL_TYPES.indexOf(b.meal_type) - MEAL_TYPES.indexOf(a.meal_type)
    })
  }, [state, user.hostel_id])

  const activeMeal = useMemo(() => {
    if (selectedMealId) return pastMeals.find((m) => m.id === selectedMealId)
    return pastMeals[0]
  }, [pastMeals, selectedMealId])

  // Hackathon Demo Injection Function
  const injectDemoData = () => {
    if (!activeMeal || !activeMeal.dishes) return
    
    const newMockData = []
    const numStudents = 120
    const issuesList = ['Too Spicy', 'Undercooked', 'Bad Taste / Stale', 'Not my favorite', 'Not Hungry / Rush', 'Other Reason']

    for (let i = 0; i < numStudents; i++) {
      const isClean = Math.random() > 0.35 // 65% clean plate rate
      
      if (isClean) {
        newMockData.push({
          hostel_id: user.hostel_id,
          date: activeMeal.date,
          meal_type: activeMeal.meal_type,
          status: 'Clean Plate',
          dish_name: null,
          issue: null
        })
      } else {
        // Pick a random dish to complain about
        const randomDish = activeMeal.dishes[Math.floor(Math.random() * activeMeal.dishes.length)]
        // Pick 1 or 2 random issues
        const issueCount = Math.random() > 0.8 ? 2 : 1
        const shuffledIssues = [...issuesList].sort(() => 0.5 - Math.random())
        const selectedIssues = shuffledIssues.slice(0, issueCount).join(', ')
        
        newMockData.push({
          hostel_id: user.hostel_id,
          date: activeMeal.date,
          meal_type: activeMeal.meal_type,
          status: 'Leftover',
          dish_name: randomDish,
          issue: selectedIssues
        })
      }
    }
    setLocalMockData((prev) => [...prev, ...newMockData])
  }

  const analytics = useMemo(() => {
    if (!activeMeal) return null

    // Combine real context data with our local injected mock data
    const realFeedback = state.kioskFeedback || []
    const allFeedback = [...realFeedback, ...localMockData]
    
    const mealFeedback = allFeedback.filter(
      (f) =>
        f.hostel_id === user.hostel_id &&
        f.date === activeMeal.date &&
        f.meal_type === activeMeal.meal_type
    )

    const total = mealFeedback.length
    if (total === 0) return { total: 0 }

    const cleanPlates = mealFeedback.filter((f) => f.status === 'Clean Plate').length
    const leftovers = mealFeedback.filter((f) => f.status === 'Leftover').length

    const dishStats = {}
    mealFeedback
      .filter((f) => f.status === 'Leftover' && f.dish_name)
      .forEach((f) => {
        if (!dishStats[f.dish_name]) {
          dishStats[f.dish_name] = { totalLeftoverReports: 0, issues: {} }
        }
        dishStats[f.dish_name].totalLeftoverReports += 1

        const issuesArray = f.issue ? f.issue.split(', ') : ['Unspecified']
        issuesArray.forEach((issue) => {
          dishStats[f.dish_name].issues[issue] = (dishStats[f.dish_name].issues[issue] || 0) + 1
        })
      })

    return {
      total,
      cleanPlates,
      leftovers,
      cleanPercent: Math.round((cleanPlates / total) * 100),
      leftoverPercent: Math.round((leftovers / total) * 100),
      dishStats,
    }
  }, [activeMeal, state.kioskFeedback, localMockData, user.hostel_id])

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-emerald-700">LESSMESS ADMIN</p>
              <h1 className="text-lg font-semibold text-slate-900">{hostel?.name}</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TimezoneBanner />
            <button
              type="button"
              onClick={() => {
                setLocalMockData([])
                resetDemo()
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" /> Reset demo data
            </button>
            <button
              type="button"
              onClick={async () => {
                await logout()
                navigate('/login')
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50 hover:text-rose-600"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl gap-1 px-4">
          {TABS.map((item) => {
            const Icon = item.icon
            const active = tab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  active
                    ? 'border-emerald-700 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            )
          })}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {tab === 'menu' ? <MenuPlanner hostelId={user.hostel_id} /> : null}
        {tab === 'forecast' ? <ForecastPanel hostelId={user.hostel_id} /> : null}
        
        {tab === 'learning' ? (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Post-Meal Analytics</h2>
                <p className="text-sm text-slate-500">Track actual food waste based on student kiosk feedback.</p>
              </div>
              
              <select
                value={activeMeal?.id || ''}
                onChange={(e) => setSelectedMealId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 sm:w-auto min-w-[250px]"
              >
                {pastMeals.map((meal) => (
                  <option key={meal.id} value={meal.id}>
                    {meal.date} • {meal.meal_type}
                  </option>
                ))}
              </select>
            </div>

            {!analytics || analytics.total === 0 ? (
              <Card className="flex flex-col items-center justify-center p-16 text-center text-slate-500">
                <Disc className="mb-4 h-12 w-12 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-900">No data available</h3>
                <p className="mt-1 max-w-md">No kiosk feedback data has been recorded for this meal yet.</p>
                <button 
                  onClick={injectDemoData}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
                >
                  <Wand2 className="h-4 w-4" /> Generate Demo Data
                </button>
              </Card>
            ) : (
              <>
                {/* High Level Stats */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Card className="p-5">
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Total Responses</p>
                    <p className="mt-2 text-4xl font-bold text-slate-900">{analytics.total}</p>
                  </Card>
                  <Card className="p-5 border-emerald-100 bg-emerald-50/30">
                    <p className="flex items-center gap-2 text-sm font-medium text-emerald-800 uppercase tracking-wide">
                      <CheckCircle2 className="h-4 w-4" /> Clean Plates
                    </p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <p className="text-4xl font-bold text-emerald-900">{analytics.cleanPercent}%</p>
                      <p className="text-sm font-medium text-emerald-700">({analytics.cleanPlates} students)</p>
                    </div>
                  </Card>
                  <Card className="p-5 border-amber-100 bg-amber-50/30">
                    <p className="flex items-center gap-2 text-sm font-medium text-amber-800 uppercase tracking-wide">
                      <Disc className="h-4 w-4" /> Leftovers
                    </p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <p className="text-4xl font-bold text-amber-900">{analytics.leftoverPercent}%</p>
                      <p className="text-sm font-medium text-amber-700">({analytics.leftovers} students)</p>
                    </div>
                  </Card>
                </div>

                {/* Dish-by-Dish Breakdown */}
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900">Specific Issue Breakdown by Dish</h3>
                    <button 
                      onClick={injectDemoData}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      + Inject more demo data
                    </button>
                  </div>
                  
                  <div className="grid gap-6 md:grid-cols-2">
                    {Object.entries(analytics.dishStats).length === 0 ? (
                      <p className="text-sm text-slate-500 md:col-span-2">No specific dish issues reported. Excellent!</p>
                    ) : (
                      Object.entries(analytics.dishStats).map(([dishName, stats]) => (
                        <Card key={dishName} className="flex flex-col p-6">
                          <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                            <h4 className="text-lg font-bold text-slate-900">{dishName}</h4>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                              {stats.totalLeftoverReports} reports
                            </span>
                          </div>
                          
                          <div className="space-y-4">
                            {Object.entries(stats.issues)
                              .sort(([, valA], [, valB]) => valB - valA) // Sort by highest frequency
                              .map(([issue, count]) => {
                                const percentage = Math.round((count / stats.totalLeftoverReports) * 100)
                                return (
                                  <div key={issue}>
                                    <div className="mb-1.5 flex justify-between text-sm font-medium">
                                      <span className="text-slate-800">{issue}</span>
                                      <span className="text-slate-500">{percentage}%</span>
                                    </div>
                                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                                      <div
                                        className="h-full rounded-full bg-amber-500 transition-all duration-500"
                                        style={{ width: `${percentage}%` }}
                                      />
                                    </div>
                                  </div>
                                )
                              })}
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : null}
      </main>
    </div>
  )
}