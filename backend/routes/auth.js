const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const pool = require('../config/database')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// Validation middleware
const validateRegistration = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('El nombre de usuario debe tener entre 3 y 30 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('El nombre de usuario solo puede contener letras, números y guiones bajos'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
]

const validateLogin = [
  body('username').notEmpty().withMessage('El nombre de usuario es requerido'),
  body('password').notEmpty().withMessage('La contraseña es requerida')
]

// Register new user
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }

    const { username, password } = req.body

    // Check if username already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    )

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'El nombre de usuario ya está en uso' })
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, is_admin) VALUES ($1, $2, $3) RETURNING id, username, is_admin',
      [username, hashedPassword, false]
    )

    const user = result.rows[0]

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      token,
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.is_admin
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Error al crear el usuario' })
  }
})

// Login user
router.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }

    const { username, password } = req.body

    // Find user
    const result = await pool.query(
      'SELECT id, username, password_hash, is_admin FROM users WHERE username = $1',
      [username]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' })
    }

    const user = result.rows[0]

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas' })
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.is_admin
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Error en el login' })
  }
})

// Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, is_admin, created_at FROM users WHERE id = $1',
      [req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    const user = result.rows[0]
    res.json({
      user: {
        id: user.id,
        username: user.username,
        isAdmin: user.is_admin,
        createdAt: user.created_at
      }
    })

  } catch (error) {
    console.error('Get user info error:', error)
    res.status(500).json({ message: 'Error al obtener información del usuario' })
  }
})

module.exports = router 