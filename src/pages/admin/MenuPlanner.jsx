import { ChevronLeft, ChevronRight, History, Lock, Save } from 'lucide-react'
import { useMemo, useState } from 'react'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { MEAL_START_TIMES, MEAL_TYPES } from '../../lib/constants'
import {
  addDays,
  formatKolkataDate,
  getWeekDates,
  getWeekStart,
  isMealLocked,
} from '../../lib/timezone'

function mealState(version) {
  if (!version) return 'Draft'
  if (version.is_locked || isMealLocked(version.date, version.meal_type)) return 'Locked'
  return 'Published'
}

export default function MenuPlanner({ hostelId }) {
  const { user } = useAuth()
  const { state, saveDishes, publishMenu } = useData()
  const [weekStart, setWeekStart] = useState(getWeekStart())
  const [editing, setEditing] = useState(null)
  const [historyFor, setHistoryFor] = useState(null)
  const [error, setError] = useState('')

  const menu = useMemo(
    () =>
      state.weeklyMenus.find(
        (item) => item.hostel_id === hostelId && item.week_start_date === weekStart,
      ),
    [state.weeklyMenus, hostelId, weekStart],
  )

  const versions = useMemo(
    () => state.menuVersions.filter((item) => item.menu_id === menu?.id),
    [state.menuVersions, menu],
  )

  const days = getWeekDates(weekStart)

  const openEditor = (version) => {
    setError('')
    setEditing({
      ...version,
      draft: version.dishes.join('\n'),
    })
  }

  const save = () => {
    try {
      const dishes = editing.draft
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
      saveDishes(editing.id, dishes, user.id)
      setEditing(null)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Weekly menu management</h2>
          <p className="text-sm text-slate-500">
            Meals auto-lock at start time in Asia/Kolkata. Dish edits keep a change history.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="min-w-[220px] text-center text-sm font-medium text-slate-800">
            Week of {formatKolkataDate(weekStart)}
          </div>
          <button
            type="button"
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {menu?.status === 'Draft' ? (
            <button
              type="button"
              onClick={() => publishMenu(menu.id)}
              className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white"
            >
              Publish week
            </button>
          ) : null}
        </div>
      </div>

      {!menu ? (
        <Card className="p-8 text-sm text-slate-600">
          No weekly menu exists for this hostel week. Reset demo data from the sidebar to seed a planner.
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <Badge tone={menu.status}>{menu.status}</Badge>
              <span className="text-xs text-slate-500">Hostel-scoped to this bhawan only</span>
            </div>
          </div>
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Meal</th>
                {days.map((day) => (
                  <th key={day} className="px-3 py-3">
                    {formatKolkataDate(day)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MEAL_TYPES.map((meal) => (
                <tr key={meal} className="border-t border-slate-200 align-top">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{meal}</div>
                    <div className="text-xs text-slate-500">
                      Locks {MEAL_START_TIMES[meal].label} IST
                    </div>
                  </td>
                  {days.map((day) => {
                    const version = versions.find(
                      (item) => item.date === day && item.meal_type === meal,
                    )
                    const tone = menu.status === 'Draft' ? 'Draft' : mealState(version)
                    return (
                      <td key={`${day}-${meal}`} className="px-3 py-3">
                        <div className="rounded-lg border border-slate-200 p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <Badge tone={tone}>{tone}</Badge>
                            {tone !== 'Locked' && menu.status !== 'Completed' ? (
                              <button
                                type="button"
                                onClick={() => openEditor(version)}
                                className="text-xs font-medium text-emerald-700"
                              >
                                Add / swap
                              </button>
                            ) : (
                              <Lock className="h-3.5 w-3.5 text-slate-400" />
                            )}
                          </div>
                          <ul className="space-y-1 text-xs text-slate-700">
                            {(version?.dishes || []).map((dish) => (
                              <li key={dish}>{dish}</li>
                            ))}
                          </ul>
                          <button
                            type="button"
                            onClick={() => setHistoryFor(version)}
                            className="mt-2 inline-flex items-center gap-1 text-[11px] text-slate-500"
                          >
                            <History className="h-3 w-3" /> History
                          </button>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {editing ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4">
          <Card className="w-full max-w-lg p-5">
            <h3 className="text-base font-semibold text-slate-900">
              Edit {editing.meal_type} · {formatKolkataDate(editing.date)}
            </h3>
            <p className="mt-1 text-xs text-slate-500">One dish per line. Previous dishes are retained in history.</p>
            <textarea
              value={editing.draft}
              onChange={(event) => setEditing({ ...editing, draft: event.target.value })}
              rows={8}
              className="mt-3 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none ring-emerald-700/20 focus:ring-4"
            />
            {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg px-3 py-2 text-sm">
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white"
              >
                <Save className="h-4 w-4" /> Save dishes
              </button>
            </div>
          </Card>
        </div>
      ) : null}

      {historyFor ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4">
          <Card className="w-full max-w-lg p-5">
            <h3 className="text-base font-semibold">Change history</h3>
            <div className="mt-3 max-h-80 space-y-2 overflow-auto text-sm">
              {state.menuVersionHistory
                .filter((row) => row.menu_version_id === historyFor.id)
                .map((row) => (
                  <div key={row.id} className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">{row.changed_at}</p>
                    <p className="mt-1">{row.dishes.join(', ')}</p>
                  </div>
                ))}
            </div>
            <button
              type="button"
              onClick={() => setHistoryFor(null)}
              className="mt-4 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"
            >
              Close
            </button>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
