import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('token')
    if (token) {
      checkAuthStatus()
    } else {
      setLoading(false)
    }
  }, [])

  const buildErrorMessage = (error, fallback) => {
    // Axios error shape: response (server replied), request (no reply), message (config/runtime)
    if (error?.response) {
      const status = error.response.status
      const data = error.response.data
      const backendMsg = (typeof data === 'string') ? data : (data?.message || data?.error)
      return `HTTP ${status}${backendMsg ? ` · ${backendMsg}` : ''}`
    }
    if (error?.request) {
      return 'Sin respuesta del servidor (revisa la URL del API y CORS)'
    }
    return fallback || 'Error desconocido'
  }

  const checkAuthStatus = async () => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data.user)
    } catch (error) {
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', {
        username,
        password
      })
      const { token, user } = response.data
      localStorage.setItem('token', token)
      setUser(user)
      return { success: true }
    } catch (error) {
      const message = buildErrorMessage(error, 'Error de login')
      return { success: false, error: message }
    }
  }

  const register = async (username, password) => {
    try {
      const response = await api.post('/auth/register', {
        username,
        password
      })
      const { token, user } = response.data
      localStorage.setItem('token', token)
      setUser(user)
      return { success: true }
    } catch (error) {
      const message = buildErrorMessage(error, 'Error de registro')
      return { success: false, error: message }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const value = {
    user,
    login,
    register,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 