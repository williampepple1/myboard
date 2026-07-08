'use client'

import { createContext, useContext } from 'react'

type Theme = 'light'

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'light', toggle: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always render in light mode
  return (
    <ThemeContext.Provider value={{ theme: 'light', toggle: () => {} }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
