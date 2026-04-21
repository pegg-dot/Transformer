'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type Mode = 'beginner' | 'advanced'

const MODE_KEY = 'viz.mode'

interface Ctx {
  mode: Mode
  setMode: (m: Mode) => void
  toggle: () => void
}

const ModeContext = createContext<Ctx>({
  mode: 'beginner',
  setMode: () => {},
  toggle: () => {},
})

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>('beginner')

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(MODE_KEY)
      if (stored === 'beginner' || stored === 'advanced') setMode(stored)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(MODE_KEY, mode)
    } catch {
      /* ignore */
    }
  }, [mode])

  return (
    <ModeContext.Provider
      value={{
        mode,
        setMode,
        toggle: () => setMode((m) => (m === 'beginner' ? 'advanced' : 'beginner')),
      }}
    >
      {children}
    </ModeContext.Provider>
  )
}

export function useMode() {
  return useContext(ModeContext)
}
