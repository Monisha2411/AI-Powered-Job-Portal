import { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react'
import { authApi } from '../api/auth'

const AuthContext = createContext(null)

function clearStoredTokens() {
  try {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  } catch {
    // Keep the app usable when browser storage is unavailable.
  }
}

function saveTokens(access, refresh) {
  localStorage.setItem('access_token', access)
  localStorage.setItem('refresh_token', refresh)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    let active = true
    let token = null

    try {
      token = localStorage.getItem('access_token')
    } catch {
      token = null
    }

    if (!token) {
      setLoading(false)
      setInitialized(true)
      return () => {
        active = false
      }
    }

    authApi
      .getProfile()
      .then((res) => {
        if (active) setUser(res.data)
      })
      .catch(() => {
        clearStoredTokens()
      })
      .finally(() => {
        if (active) {
          setLoading(false)
          setInitialized(true)
        }
      })

    return () => {
      active = false
    }
  }, [])

  const login = async (username, password) => {
    const res = await authApi.login(username, password)
    saveTokens(res.data.access, res.data.refresh)

    try {
      const profile = await authApi.getProfile()
      setUser(profile.data)
      return profile.data
    } catch (error) {
      clearStoredTokens()
      setUser(null)
      throw error
    }
  }

  const register = async (data) => {
    const res = await authApi.register(data)
    saveTokens(res.data.tokens.access, res.data.tokens.refresh)
    setUser(res.data.user)
    return res.data.user
  }

  const logout = () => {
    clearStoredTokens()
    setUser(null)
  }

  const updateUser = (data) => {
    setUser(data)
  }

  const value = useMemo(() => ({
    user,
    setUser,
    loading,
    initialized,
    login,
    register,
    logout,
    updateUser,
  }), [user, loading, initialized])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }

  return context
}
