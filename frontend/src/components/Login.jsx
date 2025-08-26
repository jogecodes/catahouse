import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, LogIn } from 'lucide-react'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('Por favor, completa todos los campos')
      setLoading(false)
      return
    }

    const result = await login(username.trim(), password)
    
    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  return (
    <div className="text-center">
      <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <h1 className="mb-6">🍷 Iniciar Sesión</h1>
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Nombre de Usuario
            </label>
            <input
              type="text"
              id="username"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tu nombre de usuario"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)'
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%' }}
          >
            <LogIn size={16} />
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>
        
        <div className="mb-4" style={{ marginTop: '1.5rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>
            ¿No tienes cuenta?{' '}
            <Link to="/register" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login 