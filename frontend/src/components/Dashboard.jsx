import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Star, TrendingUp, Users, Award } from 'lucide-react'

function Dashboard() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    totalItems: 0,
    totalRatings: 0,
    totalUsers: 0,
    topRated: null
  })

  useEffect(() => {
    fetchItems()
    fetchStats()
  }, [])

  const fetchItems = async () => {
    try {
      const response = await axios.get('/api/items')
      setItems(response.data.items)
    } catch (error) {
      setError('Error al cargar los items')
      console.error('Error fetching items:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  if (loading) {
    return (
      <div className="text-center">
        <div className="spinner"></div>
        <p>Cargando items...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-error">
        {error}
      </div>
    )
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h1>🍷 Panel de Cata</h1>
        <p className="text-center" style={{ color: 'var(--text-secondary)' }}>
          Selecciona un item para enviar tu cata y puntuarlo en las diferentes categorías
        </p>
      </div>

      {/* Stats Section */}
      <div className="stats-grid mb-6">
        <div className="stat-card card">
          <div className="stat-number">{stats.totalItems}</div>
          <div className="stat-label">Items en Concurso</div>
        </div>
        <div className="stat-card card">
          <div className="stat-number">{stats.totalRatings}</div>
          <div className="stat-label">Catas Enviadas</div>
        </div>
        <div className="stat-card card">
          <div className="stat-number">{stats.totalUsers}</div>
          <div className="stat-label">Usuarios Activos</div>
        </div>
        <div className="stat-card card">
          <div className="stat-number">
            {stats.topRated ? stats.topRated.average.toFixed(1) : '0.0'}
          </div>
          <div className="stat-label">Mejor Puntuación</div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-3">
        {items.map((item) => (
          <div key={item.id} className="card item-card">
            {item.image_url && (
              <img 
                src={item.image_url} 
                alt={item.name}
                className="item-image"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            )}
            
            <h3 className="item-title">{item.name}</h3>
            <p className="item-description">{item.description}</p>
            
            <div className="rating-summary">
              <div className="rating-average">
                {item.average_rating ? item.average_rating.toFixed(1) : '0.0'}
              </div>
              <div className="rating-count">
                {item.rating_count || 0} catas
              </div>
            </div>
            
            <Link 
              to={`/rate/${item.id}`} 
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Star size={16} />
              Enviar Cata
            </Link>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center">
          <div className="card">
            <h3>No hay items disponibles</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Contacta con un administrador para añadir items al concurso.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard 