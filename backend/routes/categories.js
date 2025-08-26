const express = require('express')
const { body, validationResult } = require('express-validator')
const pool = require('../config/database')
const { authenticateToken, requireAdmin } = require('../middleware/auth')

const router = express.Router()

// Get all categories (public)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.description,
        c.created_at,
        COUNT(r.id) as rating_count
      FROM categories c
      LEFT JOIN ratings r ON c.id = r.category_id
      GROUP BY c.id, c.name, c.description, c.created_at
      ORDER BY c.name ASC
    `)

    res.json({ categories: result.rows })
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({ message: 'Error al obtener las categorías' })
  }
})

// Get single category (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.description,
        c.created_at,
        COUNT(r.id) as rating_count
      FROM categories c
      LEFT JOIN ratings r ON c.id = r.category_id
      WHERE c.id = $1
      GROUP BY c.id, c.name, c.description, c.created_at
    `, [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Categoría no encontrada' })
    }

    res.json({ category: result.rows[0] })
  } catch (error) {
    console.error('Get category error:', error)
    res.status(500).json({ message: 'Error al obtener la categoría' })
  }
})

// Create category (admin only)
router.post('/', authenticateToken, requireAdmin, [
  body('name').notEmpty().withMessage('El nombre es requerido'),
  body('description').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }

    const { name, description } = req.body

    // Check if category name already exists
    const existingCategory = await pool.query(
      'SELECT id FROM categories WHERE name = $1',
      [name]
    )

    if (existingCategory.rows.length > 0) {
      return res.status(400).json({ message: 'Ya existe una categoría con ese nombre' })
    }

    const result = await pool.query(
      'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    )

    res.status(201).json({
      message: 'Categoría creada exitosamente',
      category: result.rows[0]
    })
  } catch (error) {
    console.error('Create category error:', error)
    res.status(500).json({ message: 'Error al crear la categoría' })
  }
})

// Update category (admin only)
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
    const { name, description } = req.body

    // Check if category exists
    const existingCategory = await pool.query('SELECT id FROM categories WHERE id = $1', [id])
    if (existingCategory.rows.length === 0) {
      return res.status(404).json({ message: 'Categoría no encontrada' })
    }

    // Check if new name conflicts with existing category
    const nameConflict = await pool.query(
      'SELECT id FROM categories WHERE name = $1 AND id != $2',
      [name, id]
    )

    if (nameConflict.rows.length > 0) {
      return res.status(400).json({ message: 'Ya existe una categoría con ese nombre' })
    }

    const result = await pool.query(
      'UPDATE categories SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [name, description, id]
    )

    res.json({
      message: 'Categoría actualizada exitosamente',
      category: result.rows[0]
    })
  } catch (error) {
    console.error('Update category error:', error)
    res.status(500).json({ message: 'Error al actualizar la categoría' })
  }
})

// Delete category (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    // Check if category exists
    const existingCategory = await pool.query('SELECT id FROM categories WHERE id = $1', [id])
    if (existingCategory.rows.length === 0) {
      return res.status(404).json({ message: 'Categoría no encontrada' })
    }

    // Check if category has ratings
    const ratingsCount = await pool.query(
      'SELECT COUNT(*) FROM ratings WHERE category_id = $1',
      [id]
    )

    if (parseInt(ratingsCount.rows[0].count) > 0) {
      return res.status(400).json({ 
        message: 'No se puede eliminar una categoría que tiene puntuaciones asociadas' 
      })
    }

    // Delete category
    await pool.query('DELETE FROM categories WHERE id = $1', [id])

    res.json({ message: 'Categoría eliminada exitosamente' })
  } catch (error) {
    console.error('Delete category error:', error)
    res.status(500).json({ message: 'Error al eliminar la categoría' })
  }
})

module.exports = router 