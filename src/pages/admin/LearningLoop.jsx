import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Card from '../../components/ui/Card'
import { useData } from '../../context/DataContext'
import { mealLearningStats, formatPercent } from '../../lib/aggregations'
import { MEAL_TYPES } from '../../lib/constants'
import { versionsForHostel } from '../../lib/dataStore'
import { formatKolkataDate, toKolkataDateString } from '../../lib/timezone'

export default function LearningLoop({ hostelId }) {
  const { state, submitWaste } = useData()
  const today = toKolkataDateString()
  const [date, setDate] = useState(today)
  const [mealType, setMealType] = useState('Lunch')
  const [kg, setKg] = useState('')
  const [message, setMessage] = useState('')

  const versions = versionsForHostel(state, hostelId)

  const onSave = (event) => {
    event.preventDefault()
    const value = Number(kg)
    if (!Number.isFinite(value) || value < 0) {
      setMessage('Enter a valid waste weight in kg.')
      return
    }
    submitWaste({
      hostel_id: hostelId,
      date,
      meal_type: mealType,
      actual_waste_kg: value,
    })
    setMessage('Waste log saved for this hostel meal.')
    setKg('')
  }

  const chartData = useMemo(() => {
    const recent = versions
      .filter((version) => version.date <= today)
      .sort((a, b) => {
        const dateCmp = a.date.localeCompare(b.date)
        if (dateCmp !== 0) return dateCmp
        return MEAL_TYPES.indexOf(a.meal_type) - MEAL_TYPES.indexOf(b.meal_type)
      })
      .slice(-12)

    return recent.map((version) => {
      const preMeal = state.preMealFeedback.filter((row) => row.menu_version_id === version.id)
      const kiosk = state.postMealKioskFeedback.filter(
        (row) =>
          row.hostel_id === hostelId &&
          row.date === version.date &&
          row.meal_type === version.meal_type,
      )
      const waste = state.mealWasteLogs.find(
        (row) =>
          row.hostel_id === hostelId &&
          row.date === version.date &&
          row.meal_type === version.meal_type,
      )
      const stats = mealLearningStats({
        preMeal,
        kiosk,
        wasteKg: waste?.actual_waste_kg,
      })
      return {
        label: `${version.date.slice(5)} ${version.meal_type.slice(0, 1)}`,
        anticipatedDissatisfaction: stats.lowRatingPct ?? 0,
        skipIntent: stats.skipPct ?? 0,
        leftoverShare: stats.leftoverPct ?? 0,
        actualWasteKg: stats.actualWasteKg ?? 0,
        date: version.date,
        meal: version.meal_type,
      }
    })
  }, [versions, state, hostelId, today])

  const currentWaste = state.mealWasteLogs.find(
    (row) => row.hostel_id === hostelId && row.date === date && row.meal_type === mealType,
  )

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Post-meal learning loop</h2>
        <p className="text-sm text-slate-500">
          Compare anticipated dissatisfaction with measured waste and anonymous kiosk leftovers.
          Pre-meal skip intent is shown separately and is never counted as waste.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.3fr]">
        <Card className="p-5">
          <h3 className="font-semibold">Log actual waste</h3>
          <form onSubmit={onSave} className="mt-4 space-y-3">
            <label className="block text-sm">
              Date (Asia/Kolkata)
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              Meal
              <select
                value={mealType}
                onChange={(event) => setMealType(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              >
                {MEAL_TYPES.map((meal) => (
                  <option key={meal}>{meal}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Actual waste (kg)
              <input
                type="number"
                min="0"
                step="0.1"
                value={kg}
                onChange={(event) => setKg(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder={currentWaste ? String(currentWaste.actual_waste_kg) : 'e.g. 12.4'}
              />
            </label>
            <button type="submit" className="w-full rounded-lg bg-emerald-700 py-2.5 text-sm font-semibold text-white">
              Save waste log
            </button>
            {message ? <p className="text-sm text-emerald-800">{message}</p> : null}
          </form>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-semibold">Anticipated dissatisfaction vs measured waste</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="anticipatedDissatisfaction"
                  name="Low ratings %"
                  fill="#047857"
                />
                <Bar yAxisId="left" dataKey="leftoverShare" name="Kiosk leftover %" fill="#7c3aed" />
                <Bar yAxisId="right" dataKey="actualWasteKg" name="Actual waste kg" fill="#0f172a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Meal</th>
              <th className="px-4 py-3">Low ratings</th>
              <th className="px-4 py-3">Skip intent</th>
              <th className="px-4 py-3">Kiosk leftovers</th>
              <th className="px-4 py-3">Actual waste</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((row) => (
              <tr key={`${row.date}-${row.meal}`} className="border-t border-slate-200">
                <td className="px-4 py-3">
                  {formatKolkataDate(row.date)} · {row.meal}
                </td>
                <td className="px-4 py-3">{row.anticipatedDissatisfaction}%</td>
                <td className="px-4 py-3">{row.skipIntent}%</td>
                <td className="px-4 py-3">{row.leftoverShare}%</td>
                <td className="px-4 py-3">
                  {row.actualWasteKg > 0 ? `${row.actualWasteKg} kg` : 'Not logged'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-4 py-3 text-xs text-slate-500">
          Denominators are response counts and kiosk submissions for that hostel meal only.
          Percentages use that meal's response count or kiosk submission count as the denominator.
        </p>
      </Card>
    </div>
  )
}
