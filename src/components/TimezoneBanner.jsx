import { Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { TIMEZONE } from '../lib/constants'
import { formatKolkataDateTime } from '../lib/timezone'

export default function TimezoneBanner() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm">
      <Clock className="h-3.5 w-3.5 text-emerald-700" />
      <span className="font-medium text-slate-800">{formatKolkataDateTime(now)}</span>
      <span className="text-slate-400">{TIMEZONE}</span>
    </div>
  )
}
