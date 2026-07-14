import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ThemeState {
  primary: string
  primaryHover: string
  setTheme: (primary: string, primaryHover: string) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      primary: '#4338CA', // default purple
      primaryHover: '#3730A3', // default darker purple
      setTheme: (primary, primaryHover) => set({ primary, primaryHover }),
    }),
    {
      name: 'myboard-theme',
    }
  )
)
