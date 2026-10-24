const STYLES = {
  Draft: 'bg-slate-100 text-slate-700',
  Published: 'bg-emerald-50 text-emerald-800',
  Locked: 'bg-amber-50 text-amber-800',
  Completed: 'bg-slate-800 text-white',
  Low: 'bg-emerald-50 text-emerald-800',
  Medium: 'bg-amber-50 text-amber-800',
  High: 'bg-rose-50 text-rose-800',
  Insufficient: 'bg-slate-100 text-slate-600',
}

export default function Badge({ children, tone = 'Draft' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[tone] || STYLES.Draft}`}
    >
      {children}
    </span>
  )
}
