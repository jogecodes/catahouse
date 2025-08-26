import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, User, Trophy, Star } from 'lucide-react'

function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) return null

  return (
    <header className="header">
      <div className="container">
        <nav className="nav">
          <Link to="/dashboard" className="nav-brand">
            🍷 CataHouse
          </Link>
          
          <ul className="nav-menu">
            <li>
              <Link to="/dashboard" className="nav-link">
                <Star size={16} />
                Enviar Cata
              </Link>
            </li>
            <li>
              <Link to="/results" className="nav-link">
                <Trophy size={16} />
                Ver Resultados
              </Link>
            </li>
            {user.isAdmin && (
              <li>
                <Link to="/admin" className="nav-link">
                  <User size={16} />
                  Admin
                </Link>
              </li>
            )}
            <li>
              <button onClick={handleLogout} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <LogOut size={16} />
                Salir
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default Header 