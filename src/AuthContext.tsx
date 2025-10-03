import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface User { id: string; name?: string; email?: string }

interface AuthContextType {
  loggedIn: boolean
  user: User | null
  login: (user: User) => void
  logout: () => void
  authLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loggedIn, setLoggedIn] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/me")
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
          setLoggedIn(true)
        }
      } catch (err) {
        console.error("Auth check failed", err)
      } finally {
        setAuthLoading(false)
      }
    }
    checkAuth()
  }, [])

  const login = (user: User) => {
    setLoggedIn(true)
    setUser(user)
  }
  const logout = async () => {
    await fetch('/logout', { method: 'POST' })
    setLoggedIn(false)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ loggedIn, user, login, logout, authLoading }}>
      {children}
    </AuthContext.Provider>
  )
}