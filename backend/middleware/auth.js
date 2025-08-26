const jwt = require('jsonwebtoken')
const pool = require('../config/database')

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Token de acceso requerido' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    
    // Get user from database to ensure it still exists
    const result = await pool.query(
      'SELECT id, username, is_admin FROM users WHERE id = $1',
      [decoded.userId]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' })
    }

    req.user = result.rows[0]
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado' })
    }
    return res.status(403).json({ message: 'Token no válido' })
  }
}

const requireAdmin = (req, res, next) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador.' })
  }
  next()
}

module.exports = {
  authenticateToken,
  requireAdmin
} 