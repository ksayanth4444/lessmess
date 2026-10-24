import { Star } from 'lucide-react'

export default function StarScale({ value, onChange, size = 'md' }) {
  const dim = size === 'lg' ? 'h-8 w-8' : 'h-5 w-5'
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Preference rating">
      {[1, 2, 3, 4, 5].map((score) => {
        const active = score <= value
        return (
          <button
            key={score}
            type="button"
            role="radio"
            aria-checked={value === score}
            onClick={() => onChange(score)}
            className="rounded-md p-1 hover:bg-slate-50"
          >
            <Star
              className={`${dim} ${active ? 'fill-emerald-700 text-emerald-700' : 'text-slate-300'}`}
            />
          </button>
        )
      })}
    </div>
  )
}
