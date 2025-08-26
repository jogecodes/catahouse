const express = require('express')
const pool = require('../config/database')

const router = express.Router()

// Get general statistics for dashboard
router.get('/', async (req, res) => {
  try {
    // Get total counts
    const [totalItems, totalRatings, totalUsers, topRated] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM items'),
      pool.query('SELECT COUNT(*) as count FROM ratings'),
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query(`
        SELECT 
          i.name,
          AVG(r.stars) as average
        FROM items i
        JOIN ratings r ON i.id = r.item_id
        GROUP BY i.id, i.name
        HAVING COUNT(r.id) >= 3
        ORDER BY average DESC
        LIMIT 1
      `)
    ])

    // Get recent activity
    const recentActivity = await pool.query(`
      SELECT 
        'rating' as type,
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
      LIMIT 10
    `)

    // Get category statistics
    const categoryStats = await pool.query(`
      SELECT 
        c.name,
        COUNT(r.id) as rating_count,
        AVG(r.stars) as average_rating
      FROM categories c
      LEFT JOIN ratings r ON c.id = r.category_id
      GROUP BY c.id, c.name
      ORDER BY rating_count DESC
    `)

    // Get user participation
    const userParticipation = await pool.query(`
      SELECT 
        u.username,
        COUNT(r.id) as ratings_count,
        AVG(r.stars) as average_rating
      FROM users u
      LEFT JOIN ratings r ON u.id = r.user_id
      GROUP BY u.id, u.username
      ORDER BY ratings_count DESC
      LIMIT 10
    `)

    res.json({
      totalItems: parseInt(totalItems.rows[0].count),
      totalRatings: parseInt(totalRatings.rows[0].count),
      totalUsers: parseInt(totalUsers.rows[0].count),
      topRated: topRated.rows[0] || null,
      recentActivity: recentActivity.rows,
      categoryStats: categoryStats.rows,
      userParticipation: userParticipation.rows
    })

  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ message: 'Error al obtener las estadísticas' })
  }
})

// Get detailed statistics for a specific period
router.get('/period', async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    
    let dateFilter = ''
    let params = []
    
    if (startDate && endDate) {
      dateFilter = 'WHERE r.created_at BETWEEN $1 AND $2'
      params = [startDate, endDate]
    }

    // Get ratings over time
    const ratingsOverTime = await pool.query(`
      SELECT 
        DATE(r.created_at) as date,
        COUNT(*) as ratings_count,
        AVG(r.stars) as average_rating
      FROM ratings r
      ${dateFilter}
      GROUP BY DATE(r.created_at)
      ORDER BY date ASC
    `, params)

    // Get top items for period
    const topItemsPeriod = await pool.query(`
      SELECT 
        i.name,
        COUNT(r.id) as ratings_count,
        AVG(r.stars) as average_rating
      FROM items i
      JOIN ratings r ON i.id = r.item_id
      ${dateFilter}
      GROUP BY i.id, i.name
      HAVING COUNT(r.id) >= 2
      ORDER BY average_rating DESC, ratings_count DESC
      LIMIT 10
    `, params)

    // Get most active users for period
    const activeUsersPeriod = await pool.query(`
      SELECT 
        u.username,
        COUNT(r.id) as ratings_count,
        AVG(r.stars) as average_rating
      FROM users u
      JOIN ratings r ON u.id = r.user_id
      ${dateFilter}
      GROUP BY u.id, u.username
      ORDER BY ratings_count DESC
      LIMIT 10
    `, params)

    res.json({
      ratingsOverTime: ratingsOverTime.rows,
      topItemsPeriod: topItemsPeriod.rows,
      activeUsersPeriod: activeUsersPeriod.rows
    })

  } catch (error) {
    console.error('Get period stats error:', error)
    res.status(500).json({ message: 'Error al obtener las estadísticas del período' })
  }
})

// Get comparison statistics between items
router.get('/compare', async (req, res) => {
  try {
    const { itemIds } = req.query
    
    if (!itemIds || !Array.isArray(itemIds) || itemIds.length < 2) {
      return res.status(400).json({ message: 'Se requieren al menos 2 IDs de items para comparar' })
    }

    const result = await pool.query(`
      SELECT 
        i.id,
        i.name,
        c.name as category_name,
        AVG(r.stars) as average_rating,
        COUNT(r.id) as rating_count,
        MIN(r.stars) as min_rating,
        MAX(r.stars) as max_rating
      FROM items i
      JOIN ratings r ON i.id = r.item_id
      JOIN categories c ON r.category_id = c.id
      WHERE i.id = ANY($1)
      GROUP BY i.id, i.name, c.id, c.name
      ORDER BY i.name, c.name
    `, [itemIds])

    // Group by item and category
    const comparison = {}
    result.rows.forEach(row => {
      if (!comparison[row.id]) {
        comparison[row.id] = {
          id: row.id,
          name: row.name,
          categories: {}
        }
      }
      comparison[row.id].categories[row.category_name] = {
        average: parseFloat(row.average_rating),
        count: parseInt(row.rating_count),
        min: parseInt(row.min_rating),
        max: parseInt(row.max_rating)
      }
    })

    res.json({ comparison })

  } catch (error) {
    console.error('Get comparison stats error:', error)
    res.status(500).json({ message: 'Error al obtener las estadísticas de comparación' })
  }
})

// Get export data for admin
router.get('/export', async (req, res) => {
  try {
    const { format = 'json' } = req.query

    if (format !== 'json') {
      return res.status(400).json({ message: 'Solo se admite formato JSON por ahora' })
    }

    // Get comprehensive data for export
    const [items, categories, ratings, users] = await Promise.all([
      pool.query('SELECT * FROM items ORDER BY created_at DESC'),
      pool.query('SELECT * FROM categories ORDER BY name'),
      pool.query(`
        SELECT 
          r.*,
          u.username,
          i.name as item_name,
          c.name as category_name
        FROM ratings r
        JOIN users u ON r.user_id = u.id
        JOIN items i ON r.item_id = i.id
        JOIN categories c ON r.category_id = c.id
        ORDER BY r.created_at DESC
      `),
      pool.query('SELECT id, username, is_admin, created_at FROM users ORDER BY created_at')
    ])

    const exportData = {
      exportDate: new Date().toISOString(),
      items: items.rows,
      categories: categories.rows,
      ratings: ratings.rows,
      users: users.rows
    }

    res.json(exportData)

  } catch (error) {
    console.error('Export stats error:', error)
    res.status(500).json({ message: 'Error al exportar los datos' })
  }
})

module.exports = router 