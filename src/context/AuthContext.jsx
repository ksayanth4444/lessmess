import { createContext, useContext, useMemo, useState } from 'react'
import { loadState } from '../lib/dataStore'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext(null)
const SESSION_KEY = 'lessmess-session'

function readSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null')
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession)

  const login = async (email, password) => {
    const state = loadState()
    const match = state.users.find(
      (item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password,
    )
    if (!match) {
      throw new Error('Invalid email or password.')
    }
    const sessionUser = {
      id: match.id,
      email: match.email,
      role: match.role,
      hostel_id: match.hostel_id,
      name: match.name,
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser))
    setUser(sessionUser)

    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signInWithPassword({ email, password }).catch(() => null)
    }
    return sessionUser
  }

  const logout = async () => {
    sessionStorage.removeItem(SESSION_KEY)
    setUser(null)
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut().catch(() => null)
    }
  }

  const value = useMemo(() => ({ user, login, logout }), [user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
