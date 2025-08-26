import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, UserPlus, CheckCircle } from 'lucide-react'

function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { register } = useAuth()
  const navigate = useNavigate()

  const validateForm = () => {
    if (!username.trim()) {
      setError('El nombre de usuario es requerido')
      return false
    }
    
    if (username.trim().length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres')
      return false
    }
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return false
    }
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!validateForm()) {
      setLoading(false)
      return
    }

    const result = await register(username.trim(), password)
    
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
        <h1 className="mb-6">🍷 Crear Cuenta</h1>
        
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
              placeholder="Elige un nombre de usuario"
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
                placeholder="Elige una contraseña"
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
            <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              Mínimo 6 caracteres
            </small>
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirmar Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%' }}
          >
            <UserPlus size={16} />
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>
        
        <div className="mb-4" style={{ marginTop: '1.5rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register 