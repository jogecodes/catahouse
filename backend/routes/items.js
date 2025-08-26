const express = require('express')
const { body, validationResult } = require('express-validator')
const pool = require('../config/database')
const { authenticateToken, requireAdmin } = require('../middleware/auth')

const router = express.Router()

// Get all items (public)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        i.id,
        i.name,
        i.description,
        i.image_url,
        i.created_at,
        COALESCE(AVG(r.stars), 0) as average_rating,
        COUNT(r.id) as rating_count
      FROM items i
      LEFT JOIN ratings r ON i.id = r.item_id
      GROUP BY i.id, i.name, i.description, i.image_url, i.created_at
      ORDER BY i.created_at DESC
    `)

    res.json({ items: result.rows })
  } catch (error) {
    console.error('Get items error:', error)
    res.status(500).json({ message: 'Error al obtener los items' })
  }
})

// Get single item (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(`
      SELECT 
        i.id,
        i.name,
        i.description,
        i.image_url,
        i.created_at,
        COALESCE(AVG(r.stars), 0) as average_rating,
        COUNT(r.id) as rating_count
      FROM items i
      LEFT JOIN ratings r ON i.id = r.item_id
      WHERE i.id = $1
      GROUP BY i.id, i.name, i.description, i.image_url, i.created_at
    `, [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Item no encontrado' })
    }

    res.json({ item: result.rows[0] })
  } catch (error) {
    console.error('Get item error:', error)
    res.status(500).json({ message: 'Error al obtener el item' })
  }
})

// Create item (admin only)
router.post('/', authenticateToken, requireAdmin, [
  body('name').notEmpty().withMessage('El nombre es requerido'),
  body('description').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }

    const { name, description, image_url } = req.body

    const result = await pool.query(
      'INSERT INTO items (name, description, image_url) VALUES ($1, $2, $3) RETURNING *',
      [name, description, image_url]
    )

    res.status(201).json({
      message: 'Item creado exitosamente',
      item: result.rows[0]
    })
  } catch (error) {
    console.error('Create item error:', error)
    res.status(500).json({ message: 'Error al crear el item' })
  }
})

// Update item (admin only)
router.put('/:id', authenticateToken, requireAdmin, [
  body('name').notEmpty().withMessage('El nombre es requerido'),
  body('description').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }

    const { id } = req.params
    const { name, description, image_url } = req.body

    // Check if item exists
    const existingItem = await pool.query('SELECT id FROM items WHERE id = $1', [id])
    if (existingItem.rows.length === 0) {
      return res.status(404).json({ message: 'Item no encontrado' })
    }

    const result = await pool.query(
      'UPDATE items SET name = $1, description = $2, image_url = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [name, description, image_url, id]
    )

    res.json({
      message: 'Item actualizado exitosamente',
      item: result.rows[0]
    })
  } catch (error) {
    console.error('Update item error:', error)
    res.status(500).json({ message: 'Error al actualizar el item' })
  }
})

// Delete item (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    // Check if item exists
    const existingItem = await pool.query('SELECT id FROM items WHERE id = $1', [id])
    if (existingItem.rows.length === 0) {
      return res.status(404).json({ message: 'Item no encontrado' })
    }

    // Delete related ratings first
    await pool.query('DELETE FROM ratings WHERE item_id = $1', [id])

    // Delete item
    await pool.query('DELETE FROM items WHERE id = $1', [id])

    res.json({ message: 'Item eliminado exitosamente' })
  } catch (error) {
    console.error('Delete item error:', error)
    res.status(500).json({ message: 'Error al eliminar el item' })
  }
})

module.exports = router 