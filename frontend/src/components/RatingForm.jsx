import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Star, ArrowLeft, Send } from 'lucide-react'

function RatingForm() {
  const { itemId } = useParams()
  const navigate = useNavigate()
  
  const [item, setItem] = useState(null)
  const [categories, setCategories] = useState([])
  const [ratings, setRatings] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchItemData()
  }, [itemId])

  const fetchItemData = async () => {
    try {
      const [itemResponse, categoriesResponse] = await Promise.all([
        axios.get(`/api/items/${itemId}`),
        axios.get('/api/categories')
      ])
      
      setItem(itemResponse.data.item)
      setCategories(categoriesResponse.data.categories)
      
      // Initialize ratings with 0 for each category
      const initialRatings = {}
      categoriesResponse.data.categories.forEach(cat => {
        initialRatings[cat.id] = 0
      })
      setRatings(initialRatings)
      
    } catch (error) {
      setError('Error al cargar los datos del item')
      console.error('Error fetching item data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStarClick = (categoryId, stars) => {
    setRatings(prev => ({
      ...prev,
      [categoryId]: stars
    }))
  }

  const validateForm = () => {
    const hasRatings = Object.values(ratings).some(rating => rating > 0)
    if (!hasRatings) {
      setError('Debes puntuar al menos una categoría')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    if (!validateForm()) {
      setSubmitting(false)
      return
    }

    try {
      // Filter out categories with 0 ratings
      const ratingsToSubmit = Object.entries(ratings)
        .filter(([_, rating]) => rating > 0)
        .map(([categoryId, stars]) => ({
          category_id: parseInt(categoryId),
          stars
        }))

      await axios.post(`/api/ratings/${itemId}`, {
        ratings: ratingsToSubmit
      })

      setSuccess(true)
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
      
    } catch (error) {
      setError(error.response?.data?.message || 'Error al enviar la cata')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center">
        <div className="spinner"></div>
        <p>Cargando formulario...</p>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="alert alert-error">
        Item no encontrado
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="card">
          <h2>✅ ¡Cata enviada con éxito!</h2>
          <p>Gracias por tu participación. Redirigiendo al dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <button 
          onClick={() => navigate('/dashboard')}
          className="btn btn-secondary"
        >
          <ArrowLeft size={16} />
          Volver al Dashboard
        </button>
      </div>

      <div className="card">
        <div className="text-center mb-6">
          <h1>⭐ Enviar Cata</h1>
          <h2 className="item-title">{item.name}</h2>
          {item.description && (
            <p className="item-description">{item.description}</p>
          )}
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="category-grid">
            {categories.map((category) => (
              <div key={category.id} className="category-item">
                <div className="category-name">
                  {category.name}
                  {category.description && (
                    <small style={{ display: 'block', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                      {category.description}
                    </small>
                  )}
                </div>
                
                <div className="category-rating">
                  <div className="rating-value">
                    {ratings[category.id] || 0}
                  </div>
                  <div className="star-rating">
                    {[1, 2, 3, 4, 5].map((stars) => (
                      <span
                        key={stars}
                        className={`star ${ratings[category.id] >= stars ? 'filled' : ''}`}
                        onClick={() => handleStarClick(category.id, stars)}
                        style={{ cursor: 'pointer' }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              <Send size={16} />
              {submitting ? 'Enviando...' : 'Enviar Cata'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RatingForm 