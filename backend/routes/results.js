const express = require('express')
const pool = require('../config/database')

const router = express.Router()

// Get contest results with rankings
router.get('/', async (req, res) => {
  try {
    // Get items with their average ratings and category breakdowns
    const result = await pool.query(`
      WITH item_ratings AS (
        SELECT 
          i.id,
          i.name,
          i.description,
          i.image_url,
          i.created_at,
          AVG(r.stars) as average_rating,
          COUNT(r.id) as rating_count
        FROM items i
        LEFT JOIN ratings r ON i.id = r.item_id
        GROUP BY i.id, i.name, i.description, i.image_url, i.created_at
      ),
      category_breakdown AS (
        SELECT 
          r.item_id,
          c.id as category_id,
          c.name as category_name,
          AVG(r.stars) as average
        FROM ratings r
        JOIN categories c ON r.category_id = c.id
        GROUP BY r.item_id, c.id, c.name
      ),
      user_breakdown AS (
        SELECT 
          r.item_id,
          u.username,
          AVG(r.stars) as average,
          COUNT(r.id) as total_ratings
        FROM ratings r
        JOIN users u ON r.user_id = u.id
        GROUP BY r.item_id, u.username
      )
      SELECT 
        ir.*,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'category_id', cb.category_id,
              'category_name', cb.category_name,
              'average', cb.average
            )
          ) FILTER (WHERE cb.category_id IS NOT NULL),
          '[]'
        ) as category_ratings,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'username', ub.username,
              'average', ub.average,
              'total_ratings', ub.total_ratings
            )
          ) FILTER (WHERE ub.username IS NOT NULL),
          '[]'
        ) as user_ratings
      FROM item_ratings ir
      LEFT JOIN category_breakdown cb ON ir.id = cb.item_id
      LEFT JOIN user_breakdown ub ON ir.id = ub.item_id
      GROUP BY ir.id, ir.name, ir.description, ir.image_url, ir.created_at, ir.average_rating, ir.rating_count
      ORDER BY ir.average_rating DESC NULLS LAST, ir.rating_count DESC
    `)

    // Process the results to handle JSON aggregation properly
    const processedResults = result.rows.map(row => ({
      ...row,
      category_ratings: Array.isArray(row.category_ratings) ? row.category_ratings : [],
      user_ratings: Array.isArray(row.user_ratings) ? row.user_ratings : []
    }))

    res.json({ results: processedResults })
  } catch (error) {
    console.error('Get results error:', error)
    res.status(500).json({ message: 'Error al obtener los resultados' })
  }
})

// Get detailed results for a specific item
router.get('/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params

    // Get item details
    const itemResult = await pool.query(`
      SELECT 
        i.id,
        i.name,
        i.description,
        i.image_url,
        i.created_at,
        AVG(r.stars) as average_rating,
        COUNT(r.id) as rating_count
      FROM items i
      LEFT JOIN ratings r ON i.id = r.item_id
      WHERE i.id = $1
      GROUP BY i.id, i.name, i.description, i.image_url, i.created_at
    `, [itemId])

    if (itemResult.rows.length === 0) {
      return res.status(404).json({ message: 'Item no encontrado' })
    }

    const item = itemResult.rows[0]

    // Get category breakdown
    const categoryResult = await pool.query(`
      SELECT 
        c.id as category_id,
        c.name as category_name,
        c.description as category_description,
        AVG(r.stars) as average,
        COUNT(r.id) as rating_count,
        MIN(r.stars) as min_rating,
        MAX(r.stars) as max_rating
      FROM categories c
      LEFT JOIN ratings r ON c.id = r.category_id AND r.item_id = $1
      GROUP BY c.id, c.name, c.description
      ORDER BY c.name ASC
    `, [itemId])

    // Get user breakdown
    const userResult = await pool.query(`
      SELECT 
        u.username,
        AVG(r.stars) as average,
        COUNT(r.id) as total_ratings,
        MIN(r.created_at) as first_rating,
        MAX(r.created_at) as last_rating
      FROM ratings r
      JOIN users u ON r.user_id = u.id
      WHERE r.item_id = $1
      GROUP BY u.username
      ORDER BY average DESC, total_ratings DESC
    `, [itemId])

    // Get rating distribution
    const distributionResult = await pool.query(`
      SELECT 
        r.stars,
        COUNT(*) as count
      FROM ratings r
      WHERE r.item_id = $1
      GROUP BY r.stars
      ORDER BY r.stars ASC
    `, [itemId])

    const ratingDistribution = {}
    for (let i = 1; i <= 5; i++) {
      ratingDistribution[i] = 0
    }
    distributionResult.rows.forEach(row => {
      ratingDistribution[row.stars] = parseInt(row.count)
    })

    res.json({
      item,
      categoryBreakdown: categoryResult.rows,
      userBreakdown: userResult.rows,
      ratingDistribution
    })

  } catch (error) {
    console.error('Get item results error:', error)
    res.status(500).json({ message: 'Error al obtener los resultados del item' })
  }
})

// Get results by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params

    const result = await pool.query(`
      SELECT 
        i.id,
        i.name,
        i.description,
        i.image_url,
        AVG(r.stars) as average_rating,
        COUNT(r.id) as rating_count
      FROM items i
      JOIN ratings r ON i.id = r.item_id
      WHERE r.category_id = $1
      GROUP BY i.id, i.name, i.description, i.image_url
      ORDER BY average_rating DESC, rating_count DESC
    `, [categoryId])

    res.json({ results: result.rows })
  } catch (error) {
    console.error('Get category results error:', error)
    res.status(500).json({ message: 'Error al obtener los resultados por categoría' })
  }
})

// Get top rated items
router.get('/top/:limit', async (req, res) => {
  try {
    const { limit } = req.params
    const limitNum = parseInt(limit) || 10

    const result = await pool.query(`
      SELECT 
        i.id,
        i.name,
        i.description,
        i.image_url,
        AVG(r.stars) as average_rating,
        COUNT(r.id) as rating_count
      FROM items i
      LEFT JOIN ratings r ON i.id = r.item_id
      GROUP BY i.id, i.name, i.description, i.image_url
      HAVING COUNT(r.id) >= 3
      ORDER BY average_rating DESC, rating_count DESC
      LIMIT $1
    `, [limitNum])

    res.json({ topItems: result.rows })
  } catch (error) {
    console.error('Get top items error:', error)
    res.status(500).json({ message: 'Error al obtener los items mejor puntuados' })
  }
})

module.exports = router 