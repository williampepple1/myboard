'use client'

import { createContext, useContext, useEffect } from 'react'
import { useThemeStore } from '@/store/themeStore'

type Theme = 'light'

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'light', toggle: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { primary, primaryHover } = useThemeStore()

  useEffect(() => {
    document.documentElement.style.setProperty('--primary', primary)
    document.documentElement.style.setProperty('--primary-hover', primaryHover)
  }, [primary, primaryHover])

  // Always render in light mode
  return (
    <ThemeContext.Provider value={{ theme: 'light', toggle: () => {} }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
