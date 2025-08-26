const express = require('express')
const { body, validationResult } = require('express-validator')
const pool = require('../config/database')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// Submit ratings for an item
router.post('/:itemId', authenticateToken, [
  body('ratings').isArray().withMessage('Las puntuaciones deben ser un array'),
  body('ratings.*.category_id').isInt().withMessage('ID de categoría inválido'),
  body('ratings.*.stars').isInt({ min: 1, max: 5 }).withMessage('Las estrellas deben ser entre 1 y 5')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }

    const { itemId } = req.params
    const { ratings } = req.body
    const userId = req.user.id

    // Check if item exists
    const itemExists = await pool.query('SELECT id FROM items WHERE id = $1', [itemId])
    if (itemExists.rows.length === 0) {
      return res.status(404).json({ message: 'Item no encontrado' })
    }

    // Check if user has already rated this item
    const existingRating = await pool.query(
      'SELECT id FROM ratings WHERE user_id = $1 AND item_id = $2 LIMIT 1',
      [userId, itemId]
    )

    if (existingRating.rows.length > 0) {
      return res.status(400).json({ 
        message: 'Ya has puntuado este item. Solo puedes enviar una cata por item.' 
      })
    }

    // Validate that all categories exist
    const categoryIds = ratings.map(r => r.category_id)
    const categoriesExist = await pool.query(
      'SELECT id FROM categories WHERE id = ANY($1)',
      [categoryIds]
    )

    if (categoriesExist.rows.length !== categoryIds.length) {
      return res.status(400).json({ message: 'Una o más categorías no existen' })
    }

    // Insert ratings
    const ratingValues = ratings.map(rating => 
      `(${userId}, ${itemId}, ${rating.category_id}, ${rating.stars})`
    ).join(',')

    await pool.query(`
      INSERT INTO ratings (user_id, item_id, category_id, stars)
      VALUES ${ratingValues}
    `)

    res.status(201).json({
      message: 'Cata enviada exitosamente',
      ratingsSubmitted: ratings.length
    })

  } catch (error) {
    console.error('Submit ratings error:', error)
    res.status(500).json({ message: 'Error al enviar la cata' })
  }
})

// Get user's ratings for an item
router.get('/:itemId', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params
    const userId = req.user.id

    const result = await pool.query(`
      SELECT 
        r.id,
        r.stars,
        r.created_at,
        c.name as category_name,
        c.description as category_description
      FROM ratings r
      JOIN categories c ON r.category_id = c.id
      WHERE r.user_id = $1 AND r.item_id = $2
      ORDER BY c.name ASC
    `, [userId, itemId])

    res.json({ ratings: result.rows })
  } catch (error) {
    console.error('Get user ratings error:', error)
    res.status(500).json({ message: 'Error al obtener las puntuaciones' })
  }
})

// Get all ratings for an item (admin only)
router.get('/:itemId/all', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params

    // Check if user is admin
    if (!req.user.is_admin) {
      return res.status(403).json({ message: 'Acceso denegado' })
    }

    const result = await pool.query(`
      SELECT 
        r.id,
        r.stars,
        r.created_at,
        u.username,
        c.name as category_name
      FROM ratings r
      JOIN users u ON r.user_id = u.id
      JOIN categories c ON r.category_id = c.id
      WHERE r.item_id = $1
      ORDER BY r.created_at DESC
    `, [itemId])

    res.json({ ratings: result.rows })
  } catch (error) {
    console.error('Get all ratings error:', error)
    res.status(500).json({ message: 'Error al obtener las puntuaciones' })
  }
})

// Update user's rating for a specific category
router.put('/:itemId/:categoryId', authenticateToken, [
  body('stars').isInt({ min: 1, max: 5 }).withMessage('Las estrellas deben ser entre 1 y 5')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }

    const { itemId, categoryId } = req.params
    const { stars } = req.body
    const userId = req.user.id

    // Check if rating exists
    const existingRating = await pool.query(
      'SELECT id FROM ratings WHERE user_id = $1 AND item_id = $2 AND category_id = $3',
      [userId, itemId, categoryId]
    )

    if (existingRating.rows.length === 0) {
      return res.status(404).json({ message: 'Puntuación no encontrada' })
    }

    // Update rating
    await pool.query(
      'UPDATE ratings SET stars = $1, updated_at = NOW() WHERE user_id = $2 AND item_id = $3 AND category_id = $4',
      [stars, userId, itemId, categoryId]
    )

    res.json({ message: 'Puntuación actualizada exitosamente' })
  } catch (error) {
    console.error('Update rating error:', error)
    res.status(500).json({ message: 'Error al actualizar la puntuación' })
  }
})

// Delete user's rating for a specific category
router.delete('/:itemId/:categoryId', authenticateToken, async (req, res) => {
  try {
    const { itemId, categoryId } = req.params
    const userId = req.user.id

    // Check if rating exists
    const existingRating = await pool.query(
      'SELECT id FROM ratings WHERE user_id = $1 AND item_id = $2 AND category_id = $3',
      [userId, itemId, categoryId]
    )

    if (existingRating.rows.length === 0) {
      return res.status(404).json({ message: 'Puntuación no encontrada' })
    }

    // Delete rating
    await pool.query(
      'DELETE FROM ratings WHERE user_id = $1 AND item_id = $2 AND category_id = $3',
      [userId, itemId, categoryId]
    )

    res.json({ message: 'Puntuación eliminada exitosamente' })
  } catch (error) {
    console.error('Delete rating error:', error)
    res.status(500).json({ message: 'Error al eliminar la puntuación' })
  }
})

module.exports = router 