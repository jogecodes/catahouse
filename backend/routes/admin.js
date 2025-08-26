const express = require('express')
const { body, validationResult } = require('express-validator')
const pool = require('../config/database')
const { authenticateToken, requireAdmin } = require('../middleware/auth')

const router = express.Router()

// Apply admin middleware to all routes
router.use(authenticateToken, requireAdmin)

// Get all items for admin
router.get('/items', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        i.*,
        COUNT(r.id) as rating_count,
        COALESCE(AVG(r.stars), 0) as average_rating
      FROM items i
      LEFT JOIN ratings r ON i.id = r.item_id
      GROUP BY i.id
      ORDER BY i.created_at DESC
    `)

    res.json({ items: result.rows })
  } catch (error) {
    console.error('Get admin items error:', error)
    res.status(500).json({ message: 'Error al obtener los items' })
  }
})

// Get all categories for admin
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        COUNT(r.id) as rating_count
      FROM categories c
      LEFT JOIN ratings r ON c.id = r.category_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `)

    res.json({ categories: result.rows })
  } catch (error) {
    console.error('Get admin categories error:', error)
    res.status(500).json({ message: 'Error al obtener las categorías' })
  }
})

// Get all users for admin
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.is_admin,
        u.created_at,
        COUNT(r.id) as rating_count,
        COALESCE(AVG(r.stars), 0) as average_rating
      FROM users u
      LEFT JOIN ratings r ON u.id = r.user_id
      GROUP BY u.id, u.username, u.is_admin, u.created_at
      ORDER BY u.created_at DESC
    `)

    res.json({ users: result.rows })
  } catch (error) {
    console.error('Get admin users error:', error)
    res.status(500).json({ message: 'Error al obtener los usuarios' })
  }
})

// Get system statistics for admin
router.get('/stats', async (req, res) => {
  try {
    const [totalStats, recentActivity, topItems, topUsers] = await Promise.all([
      pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM items) as total_items,
          (SELECT COUNT(*) FROM categories) as total_categories,
          (SELECT COUNT(*) FROM ratings) as total_ratings
      `),
      pool.query(`
        SELECT 
          r.created_at,
          u.username,
          i.name as item_name,
          c.name as category_name,
          r.stars
        FROM ratings r
        JOIN users u ON r.user_id = u.id
        JOIN items i ON r.item_id = i.id
        JOIN categories c ON r.category_id = c.id
        ORDER BY r.created_at DESC
        LIMIT 20
      `),
      pool.query(`
        SELECT 
          i.name,
          COUNT(r.id) as rating_count,
          AVG(r.stars) as average_rating
        FROM items i
        JOIN ratings r ON i.id = r.item_id
        GROUP BY i.id, i.name
        ORDER BY average_rating DESC, rating_count DESC
        LIMIT 10
      `),
      pool.query(`
        SELECT 
          u.username,
          COUNT(r.id) as rating_count,
          AVG(r.stars) as average_rating
        FROM users u
        JOIN ratings r ON u.id = r.user_id
        GROUP BY u.id, u.username
        ORDER BY rating_count DESC
        LIMIT 10
      `)
    ])

    res.json({
      totals: totalStats.rows[0],
      recentActivity: recentActivity.rows,
      topItems: topItems.rows,
      topUsers: topUsers.rows
    })

  } catch (error) {
    console.error('Get admin stats error:', error)
    res.status(500).json({ message: 'Error al obtener las estadísticas' })
  }
})

// Toggle user admin status
router.patch('/users/:userId/admin', [
  body('is_admin').isBoolean().withMessage('is_admin debe ser un booleano')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }

    const { userId } = req.params
    const { is_admin } = req.body

    // Prevent admin from removing their own admin status
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ message: 'No puedes cambiar tu propio estado de administrador' })
    }

    const result = await pool.query(
      'UPDATE users SET is_admin = $1 WHERE id = $2 RETURNING id, username, is_admin',
      [is_admin, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    res.json({
      message: `Usuario ${is_admin ? 'promovido a' : 'degradado de'} administrador exitosamente`,
      user: result.rows[0]
    })

  } catch (error) {
    console.error('Toggle admin status error:', error)
    res.status(500).json({ message: 'Error al cambiar el estado de administrador' })
  }
})

// Delete user (admin only)
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params

    // Prevent admin from deleting themselves
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta' })
    }

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE id = $1', [userId])
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    // Delete user's ratings first
    await pool.query('DELETE FROM ratings WHERE user_id = $1', [userId])

    // Delete user
    await pool.query('DELETE FROM users WHERE id = $1', [userId])

    res.json({ message: 'Usuario eliminado exitosamente' })

  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ message: 'Error al eliminar el usuario' })
  }
})

// Get detailed item analytics
router.get('/items/:itemId/analytics', async (req, res) => {
  try {
    const { itemId } = req.params

    const [itemStats, categoryBreakdown, userBreakdown, timeSeries] = await Promise.all([
      pool.query(`
        SELECT 
          i.*,
          COUNT(r.id) as total_ratings,
          AVG(r.stars) as overall_average,
          STDDEV(r.stars) as rating_stddev
        FROM items i
        LEFT JOIN ratings r ON i.id = r.item_id
        WHERE i.id = $1
        GROUP BY i.id
      `, [itemId]),
      pool.query(`
        SELECT 
          c.name as category_name,
          COUNT(r.id) as rating_count,
          AVG(r.stars) as average_rating,
          MIN(r.stars) as min_rating,
          MAX(r.stars) as max_rating
        FROM categories c
        LEFT JOIN ratings r ON c.id = r.category_id AND r.item_id = $1
        GROUP BY c.id, c.name
        ORDER BY c.name
      `, [itemId]),
      pool.query(`
        SELECT 
          u.username,
          COUNT(r.id) as rating_count,
          AVG(r.stars) as average_rating,
          MIN(r.created_at) as first_rating,
          MAX(r.created_at) as last_rating
        FROM ratings r
        JOIN users u ON r.user_id = u.id
        WHERE r.item_id = $1
        GROUP BY u.id, u.username
        ORDER BY rating_count DESC
      `, [itemId]),
      pool.query(`
        SELECT 
          DATE(r.created_at) as date,
          COUNT(*) as ratings_count,
          AVG(r.stars) as average_rating
        FROM ratings r
        WHERE r.item_id = $1
        GROUP BY DATE(r.created_at)
        ORDER BY date ASC
      `, [itemId])
    ])

    if (itemStats.rows.length === 0) {
      return res.status(404).json({ message: 'Item no encontrado' })
    }

    res.json({
      item: itemStats.rows[0],
      categoryBreakdown: categoryBreakdown.rows,
      userBreakdown: userBreakdown.rows,
      timeSeries: timeSeries.rows
    })

  } catch (error) {
    console.error('Get item analytics error:', error)
    res.status(500).json({ message: 'Error al obtener las analíticas del item' })
  }
})

module.exports = router 