import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  addKioskFeedback,
  loadState,
  resetDemoData,
  setMenuStatus,
  simulateForecast,
  updateMenuDishes,
  upsertPreMealFeedback,
  upsertWasteLog,
} from '../lib/dataStore'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [state, setState] = useState(() => loadState())

  useEffect(() => {
    const refresh = () => setState(loadState())
    const timer = setInterval(refresh, 30000)
    window.addEventListener('storage', refresh)
    return () => {
      clearInterval(timer)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const value = useMemo(
    () => ({
      state,
      refresh: () => setState(loadState()),
      resetDemo: () => setState(resetDemoData()),
      saveDishes: (versionId, dishes, userId) =>
        setState(updateMenuDishes(state, versionId, dishes, userId)),
      publishMenu: (menuId) => setState(setMenuStatus(state, menuId, 'Published')),
      submitPreMeal: (payload) => setState(upsertPreMealFeedback(state, payload)),
      submitKiosk: (payload) => setState(addKioskFeedback(state, payload)),
      submitWaste: (payload) => setState(upsertWasteLog(state, payload)),
      simulate: (hostelId, menuVersionId) =>
        setState(simulateForecast(state, hostelId, menuVersionId)),
    }),
    [state],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
