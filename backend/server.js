const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const itemsRoutes = require('./routes/items')
const categoriesRoutes = require('./routes/categories')
const ratingsRoutes = require('./routes/ratings')
const resultsRoutes = require('./routes/results')
const statsRoutes = require('./routes/stats')
const adminRoutes = require('./routes/admin')

const app = express()
const PORT = process.env.PORT || 5000

// Security middleware
app.use(helmet())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.'
})
app.use('/api/', limiter)

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/items', itemsRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/ratings', ratingsRoutes)
app.use('/api/results', resultsRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/admin', adminRoutes)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'Endpoint no encontrado' })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message })
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Token no válido' })
  }
  
  res.status(500).json({ message: 'Error interno del servidor' })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗 API URL: http://localhost:${PORT}/api`)
})

module.exports = app 