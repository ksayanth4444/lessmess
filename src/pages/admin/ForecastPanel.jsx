import { AlertTriangle, Sparkles, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import { useData } from '../../context/DataContext'
import {
  dishForecast,
  estimateWasteKg,
  formatPercent,
  recommendationsFromReasons,
} from '../../lib/aggregations'
import { MEAL_TYPES } from '../../lib/constants'
import { versionsForHostel } from '../../lib/dataStore'
import { formatKolkataDate, getWeekStart, toKolkataDateString } from '../../lib/timezone'

function skipPercent(feedback) {
  return dishForecast(feedback).skipPct
}

export default function ForecastPanel({ hostelId }) {
  const { state, simulate } = useData()
  const versions = versionsForHostel(state, hostelId)
    .filter((version) => {
      const menu = state.weeklyMenus.find((item) => item.id === version.menu_id)
      return menu?.status !== 'Draft'
    })
    .sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date)
      if (dateCmp !== 0) return dateCmp
      return MEAL_TYPES.indexOf(a.meal_type) - MEAL_TYPES.indexOf(b.meal_type)
    })

  const today = toKolkataDateString()
  const defaultVersion =
    versions.find((item) => item.date >= today && !item.is_locked) || versions[0]
  const [versionId, setVersionId] = useState(defaultVersion?.id || '')
  const version = versions.find((item) => item.id === versionId) || defaultVersion

  const mealFeedback = useMemo(
    () => state.preMealFeedback.filter((row) => row.menu_version_id === version?.id),
    [state.preMealFeedback, version],
  )

  const overall = dishForecast(mealFeedback)
  const perDish = (version?.dishes || []).map((dish) => ({
    dish,
    stats: dishForecast(mealFeedback.filter((row) => row.dish_name === dish)),
  }))

  const historicalLogs = state.mealWasteLogs.filter(
    (log) => log.hostel_id === hostelId && log.meal_type === version?.meal_type,
  )
  const historicalSkipPcts = versionsForHostel(state, hostelId)
    .filter((item) => item.meal_type === version?.meal_type && item.id !== version?.id)
    .map((item) =>
      skipPercent(state.preMealFeedback.filter((row) => row.menu_version_id === item.id)),
    )
    .filter((value) => value !== null)

  const estimate = estimateWasteKg({
    currentSkipPct: overall.skipPct,
    historicalLogs,
    historicalSkipPcts,
  })

  const recs = recommendationsFromReasons(overall.reasonCounts)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Pre-meal forecast</h2>
          <p className="text-sm text-slate-500">
            Preference ratings and skip intent only. Skip intent is not treated as measured waste.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={version?.id || ''}
            onChange={(event) => setVersionId(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            {versions.map((item) => (
              <option key={item.id} value={item.id}>
                {formatKolkataDate(item.date)} · {item.meal_type}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => version && simulate(hostelId, version.id)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium"
          >
            <Sparkles className="h-4 w-4 text-emerald-700" /> Simulate responses
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Responses</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-semibold">
            <Users className="h-5 w-5 text-emerald-700" />
            {overall.totalResponses}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Avg rating</p>
          <p className="mt-2 text-2xl font-semibold">
            {overall.averageRating === null ? 'N/A' : overall.averageRating.toFixed(2)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Low ratings (1-2)</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatPercent(overall.lowRatingCount, overall.totalResponses)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Skipping</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatPercent(overall.skipCount, overall.totalResponses)}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Dish-level risk</h3>
            <Badge tone={overall.risk.level}>{overall.risk.level} risk</Badge>
          </div>
          <p className="mb-4 text-xs text-slate-500">{overall.risk.detail}</p>
          <div className="space-y-3">
            {perDish.map(({ dish, stats }) => (
              <div key={dish} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-900">{dish}</p>
                  <Badge tone={stats.risk.level}>{stats.risk.level}</Badge>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-600">
                  <span>{stats.totalResponses} responses</span>
                  <span>Avg {stats.averageRating ?? 'N/A'}</span>
                  <span>Skip {formatPercent(stats.skipCount, stats.totalResponses)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold">Waste reduction estimator</h3>
            {estimate.kg === null ? (
              <p className="mt-3 text-sm text-slate-600">{estimate.message}</p>
            ) : (
              <div className="mt-3">
                <p className="text-3xl font-semibold text-emerald-800">{estimate.kg} kg</p>
                <p className="mt-1 text-xs text-slate-500">{estimate.message}</p>
              </div>
            )}
          </Card>
          <Card className="p-4">
            <h3 className="mb-3 font-semibold">Recommendations</h3>
            {recs.length === 0 ? (
              <p className="text-sm text-slate-600">No concentrated complaint reasons yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {recs.map((item) => (
                  <li key={item.reason} className="flex gap-2 rounded-lg bg-slate-50 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <span>
                      <span className="font-medium">{item.reason}</span>
                      <span className="text-slate-500"> · {item.count} mentions. </span>
                      {item.suggestion}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
      <p className="text-xs text-slate-400">
        Current hostel week starts {formatKolkataDate(getWeekStart())}. Meals: {MEAL_TYPES.join(', ')}.
      </p>
    </div>
  )
}
