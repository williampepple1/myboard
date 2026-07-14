'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/store/themeStore'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { primary, primaryHover } = useThemeStore()

  useEffect(() => {
    document.documentElement.style.setProperty('--primary', primary)
    document.documentElement.style.setProperty('--primary-hover', primaryHover)
  }, [primary, primaryHover])

  return <>{children}</>
}
