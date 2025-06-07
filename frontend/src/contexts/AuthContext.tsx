import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { endpoints } from '@/services/api'

interface User {
  id: string
  username: string
  email: string
  fullName?: string
  roles: string[]
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: { username: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  const isAuthenticated = !!user

  // Check if auth is enabled
  const authEnabled = import.meta.env.VITE_ENABLE_AUTH === 'true'

  // Initialize auth state
  useEffect(() => {
    if (!authEnabled) {
      // Mock user for development when auth is disabled
      setUser({
        id: '1',
        username: 'dev_user',
        email: 'dev@example.com',
        fullName: 'Development User',
        roles: ['admin'],
      })
      setIsLoading(false)
      return
    }

    // Check for existing token and validate
    const token = localStorage.getItem('authToken')
    if (token) {
      refreshAuth()
    } else {
      setIsLoading(false)
    }
  }, [authEnabled])

  const login = async (credentials: { username: string; password: string }) => {
    if (!authEnabled) {
      message.success('Login successful (auth disabled)')
      return
    }

    try {
      setIsLoading(true)
      const response = await endpoints.auth.login(credentials)
      
      // Store token
      localStorage.setItem('authToken', response.access_token)
      
      // Get user info
      const userInfo = await endpoints.auth.me()
      setUser(userInfo)
      
      message.success('Login successful')
      navigate('/')
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    if (!authEnabled) {
      message.success('Logged out (auth disabled)')
      return
    }

    try {
      await endpoints.auth.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('authToken')
      setUser(null)
      navigate('/login')
      message.success('Logged out successfully')
    }
  }

  const refreshAuth = async () => {
    if (!authEnabled) {
      return
    }

    try {
      setIsLoading(true)
      const userInfo = await endpoints.auth.me()
      setUser(userInfo)
    } catch (error) {
      console.error('Auth refresh error:', error)
      localStorage.removeItem('authToken')
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}