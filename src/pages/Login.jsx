import { Leaf, LockKeyhole } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { HOSTELS } from '../lib/constants'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  
  // State for all required fields
  const [role, setRole] = useState('student')
  const [hostelId, setHostelId] = useState('radhakrishna')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('demo123')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Auto-fill the email for the hackathon demo to save you time, 
  // but leaves the input editable for real use cases.
  useEffect(() => {
    setEmail(`${role}.${hostelId}@iitr.ac.in`)
  }, [role, hostelId])

  // Redirect if already logged in
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/student-app'} replace />
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    
    try {
      const session = await login(email, password)
      navigate(session.role === 'admin' ? '/admin' : '/student-app')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 sm:p-6 md:p-8">
      {/* Responsive Card Container */}
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        
        {/* Header section */}
        <div className="mb-6 flex flex-col items-center text-center sm:mb-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-700 text-white">
            <Leaf className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Welcome to LessMess</h1>
          <p className="mt-2 text-xs text-slate-500 sm:text-sm">Sign in to manage campus food waste</p>
        </div>

        {/* Login Form */}
        <form onSubmit={onSubmit} className="space-y-4 sm:space-y-5">
          
          {/* Role Selection */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Select Role</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`rounded-lg border px-3 py-2 sm:px-4 sm:py-2.5 text-sm font-semibold transition-all ${
                  role === 'student'
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`rounded-lg border px-3 py-2 sm:px-4 sm:py-2.5 text-sm font-semibold transition-all ${
                  role === 'admin'
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Administrator
              </button>
            </div>
          </div>

          {/* Bhawan Selection */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Select Bhawan</label>
            <select
              value={hostelId}
              onChange={(event) => setHostelId(event.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base text-slate-900 outline-none transition-all focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/20"
            >
              {HOSTELS.map((hostel) => (
                <option key={hostel.id} value={hostel.id}>
                  {hostel.name}
                </option>
              ))}
            </select>
          </div>

          {/* Email Input */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Institute Email</label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base text-slate-900 outline-none transition-all focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/20"
            />
          </div>
          
          {/* Password Input */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base text-slate-900 outline-none transition-all focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/20"
            />
          </div>
          
          {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={busy}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:opacity-60 sm:text-base"
          >
            <LockKeyhole className="h-4 w-4 sm:h-5 sm:w-5" />
            {busy ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
      </div>
    </div>
  )
}