import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Trophy, Star, TrendingUp, Eye, EyeOff } from 'lucide-react'

function Results() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedItems, setExpandedItems] = useState(new Set())
  const [sortBy, setSortBy] = useState('average') // 'average', 'count', 'name'

  useEffect(() => {
    fetchResults()
  }, [])

  const fetchResults = async () => {
    try {
      const response = await axios.get('/api/results')
      setResults(response.data.results)
    } catch (error) {
      setError('Error al cargar los resultados')
      console.error('Error fetching results:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (itemId) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const sortResults = (results) => {
    const sorted = [...results]
    switch (sortBy) {
      case 'average':
        return sorted.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
      case 'count':
        return sorted.sort((a, b) => (b.rating_count || 0) - (a.rating_count || 0))
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name))
      default:
        return sorted
    }
  }

  const getRankingColor = (index) => {
    if (index === 0) return '#FFD700' // Gold
    if (index === 1) return '#C0C0C0' // Silver
    if (index === 2) return '#CD7F32' // Bronze
    return 'var(--text-secondary)'
  }

  if (loading) {
    return (
      <div className="text-center">
        <div className="spinner"></div>
        <p>Cargando resultados...</p>
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

  const sortedResults = sortResults(results)

  return (
    <div>
      <div className="text-center mb-6">
        <h1>🏆 Resultados del Concurso</h1>
        <p className="text-center" style={{ color: 'var(--text-secondary)' }}>
          Ranking de items según las puntuaciones de la comunidad
        </p>
      </div>

      {/* Sort Controls */}
      <div className="card mb-4">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
          <label htmlFor="sort" style={{ fontWeight: '600' }}>Ordenar por:</label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="form-input"
            style={{ width: 'auto' }}
          >
            <option value="average">Puntuación Promedio</option>
            <option value="count">Número de Catas</option>
            <option value="name">Nombre</option>
          </select>
        </div>
      </div>

      {/* Results List */}
      <div className="grid grid-2">
        {sortedResults.map((item, index) => (
          <div key={item.id} className="card item-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div 
                style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold',
                  color: getRankingColor(index)
                }}
              >
                #{index + 1}
              </div>
              <div style={{ flex: 1 }}>
                <h3 className="item-title">{item.name}</h3>
                {item.description && (
                  <p className="item-description">{item.description}</p>
                )}
              </div>
            </div>

            {/* Rating Summary */}
            <div className="rating-summary">
              <div className="rating-average">
                {item.average_rating ? item.average_rating.toFixed(1) : '0.0'}
              </div>
              <div className="rating-count">
                {item.rating_count || 0} catas
              </div>
            </div>

            {/* Category Breakdown */}
            {item.category_ratings && (
              <div className="mb-4">
                <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  Puntuaciones por Categoría:
                </h4>
                <div className="category-grid">
                  {item.category_ratings.map((catRating) => (
                    <div key={catRating.category_id} className="category-item">
                      <span className="category-name">{catRating.category_name}</span>
                      <div className="category-rating">
                        <span className="rating-value">{catRating.average.toFixed(1)}</span>
                        <div className="star-rating">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`star ${catRating.average >= star ? 'filled' : ''}`}
                              style={{ cursor: 'default' }}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expandable User Ratings */}
            <button
              onClick={() => toggleExpanded(item.id)}
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {expandedItems.has(item.id) ? (
                <>
                  <EyeOff size={16} />
                  Ocultar Detalles
                </>
              ) : (
                <>
                  <Eye size={16} />
                  Ver Detalles
                </>
              )}
            </button>

            {/* Expanded User Ratings */}
            {expandedItems.has(item.id) && item.user_ratings && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--background)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
                  Puntuaciones de Usuarios:
                </h4>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {item.user_ratings.map((userRating, userIndex) => (
                    <div key={userIndex} style={{ 
                      padding: '0.75rem', 
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                        {userRating.username}
                      </span>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ color: 'var(--star-color)', fontWeight: '600' }}>
                          {userRating.average.toFixed(1)}
                        </span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          ({userRating.total_ratings} cat.)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {sortedResults.length === 0 && (
        <div className="text-center">
          <div className="card">
            <h3>No hay resultados disponibles</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Aún no se han enviado catas para este concurso.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Results 