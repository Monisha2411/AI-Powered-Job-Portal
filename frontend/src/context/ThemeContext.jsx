import { createContext, useState, useContext, useEffect, useCallback } from 'react'

const ThemeContext = createContext(null)

function getInitialTheme() {
  try {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark' || stored === 'light') return stored === 'dark'
  } catch {
    // Continue with the system preference when browser storage is unavailable.
  }

  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  return true
}

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(getInitialTheme)

  useEffect(() => {
    const theme = dark ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)

    try {
      localStorage.setItem('theme', theme)
    } catch {
      // The selected theme still applies for the current session.
    }
  }, [dark])

  const toggleTheme = useCallback(() => {
    setDark((current) => !current)
  }, [])

  const value = { dark, toggleTheme }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used inside a ThemeProvider')
  }

  return context
}
