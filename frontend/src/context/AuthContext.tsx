import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { User } from '../types'
import { authApi } from '../services/api'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<User>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, error: null })

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      setState({ user: null, loading: false, error: null })
      return
    }
    try {
      const { data } = await authApi.me()
      setState({ user: data, loading: false, error: null })
    } catch {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      setState({ user: null, loading: false, error: null })
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = useCallback(async (username: string, password: string): Promise<User> => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const { data } = await authApi.login(username, password)
      localStorage.setItem('accessToken', data.access)
      localStorage.setItem('refreshToken', data.refresh)
      setState({ user: data.user, loading: false, error: null })
      return data.user
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: { message?: string }; detail?: string } } }).response?.data?.error?.message
          || (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          || 'Login failed'
        : 'Login failed'
      setState((s) => ({ ...s, loading: false, error: String(message) }))
      throw err
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setState({ user: null, loading: false, error: null })
  }, [])

  const value: AuthContextValue = { ...state, login, logout, refreshUser }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
