import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, Edit, Trash2, Save, X, Users, Star, Award } from 'lucide-react'

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('items')
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Form states
  const [editingItem, setEditingItem] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [newItem, setNewItem] = useState({ name: '', description: '', image_url: '' })
  const [newCategory, setNewCategory] = useState({ name: '', description: '' })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [itemsRes, categoriesRes, usersRes] = await Promise.all([
        axios.get('/api/admin/items'),
        axios.get('/api/admin/categories'),
        axios.get('/api/admin/users')
      ])
      
      setItems(itemsRes.data.items)
      setCategories(categoriesRes.data.categories)
      setUsers(usersRes.data.users)
    } catch (error) {
      setError('Error al cargar los datos')
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (message, type = 'success') => {
    if (type === 'success') {
      setSuccess(message)
      setError('')
    } else {
      setError(message)
      setSuccess('')
    }
    setTimeout(() => {
      if (type === 'success') setSuccess('')
      else setError('')
    }, 3000)
  }

  // Items Management
  const handleCreateItem = async () => {
    try {
      const response = await axios.post('/api/admin/items', newItem)
      setItems([...items, response.data.item])
      setNewItem({ name: '', description: '', image_url: '' })
      showMessage('Item creado exitosamente')
    } catch (error) {
      showMessage(error.response?.data?.message || 'Error al crear item', 'error')
    }
  }

  const handleUpdateItem = async () => {
    try {
      const response = await axios.put(`/api/admin/items/${editingItem.id}`, editingItem)
      setItems(items.map(item => item.id === editingItem.id ? response.data.item : item))
      setEditingItem(null)
      showMessage('Item actualizado exitosamente')
    } catch (error) {
      showMessage(error.response?.data?.message || 'Error al actualizar item', 'error')
    }
  }

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este item?')) return
    
    try {
      await axios.delete(`/api/admin/items/${itemId}`)
      setItems(items.filter(item => item.id !== itemId))
      showMessage('Item eliminado exitosamente')
    } catch (error) {
      showMessage(error.response?.data?.message || 'Error al eliminar item', 'error')
    }
  }

  // Categories Management
  const handleCreateCategory = async () => {
    try {
      const response = await axios.post('/api/admin/categories', newCategory)
      setCategories([...categories, response.data.category])
      setNewCategory({ name: '', description: '' })
      showMessage('Categoría creada exitosamente')
    } catch (error) {
      showMessage(error.response?.data?.message || 'Error al crear categoría', 'error')
    }
  }

  const handleUpdateCategory = async () => {
    try {
      const response = await axios.put(`/api/admin/categories/${editingCategory.id}`, editingCategory)
      setCategories(categories.map(cat => cat.id === editingCategory.id ? response.data.category : cat))
      setEditingCategory(null)
      showMessage('Categoría actualizada exitosamente')
    } catch (error) {
      showMessage(error.response?.data?.message || 'Error al actualizar categoría', 'error')
    }
  }

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta categoría?')) return
    
    try {
      await axios.delete(`/api/admin/categories/${categoryId}`)
      setCategories(categories.filter(cat => cat.id !== categoryId))
      showMessage('Categoría eliminada exitosamente')
    } catch (error) {
      showMessage(error.response?.data?.message || 'Error al eliminar categoría', 'error')
    }
  }

  if (loading) {
    return (
      <div className="text-center">
        <div className="spinner"></div>
        <p>Cargando panel de administración...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h1>⚙️ Panel de Administración</h1>
        <p className="text-center" style={{ color: 'var(--text-secondary)' }}>
          Gestiona items, categorías y usuarios del concurso
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Tab Navigation */}
      <div className="card mb-4">
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          <button
            onClick={() => setActiveTab('items')}
            className={`btn ${activeTab === 'items' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Star size={16} />
            Items
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`btn ${activeTab === 'categories' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Award size={16} />
            Categorías
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Users size={16} />
            Usuarios
          </button>
        </div>
      </div>

      {/* Items Tab */}
      {activeTab === 'items' && (
        <div>
          <div className="card mb-4">
            <h3>Crear Nuevo Item</h3>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input
                  type="text"
                  className="form-input"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Nombre del item"
                />
              </div>
              <div className="form-group">
                <label className="form-label">URL de Imagen (opcional)</label>
                <input
                  type="url"
                  className="form-input"
                  value={newItem.image_url}
                  onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea
                className="form-input"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Descripción del item"
                rows="3"
              />
            </div>
            <button onClick={handleCreateItem} className="btn btn-primary">
              <Plus size={16} />
              Crear Item
            </button>
          </div>

          <div className="grid grid-2">
            {items.map((item) => (
              <div key={item.id} className="card">
                {editingItem?.id === item.id ? (
                  <div>
                    <input
                      type="text"
                      className="form-input mb-2"
                      value={editingItem.name}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    />
                    <textarea
                      className="form-input mb-2"
                      value={editingItem.description}
                      onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                      rows="2"
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={handleUpdateItem} className="btn btn-primary">
                        <Save size={16} />
                        Guardar
                      </button>
                      <button onClick={() => setEditingItem(null)} className="btn btn-secondary">
                        <X size={16} />
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4>{item.name}</h4>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      {item.description}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => setEditingItem(item)} 
                        className="btn btn-secondary"
                      >
                        <Edit size={16} />
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item.id)} 
                        className="btn btn-secondary"
                        style={{ background: 'var(--error)', color: 'white' }}
                      >
                        <Trash2 size={16} />
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div>
          <div className="card mb-4">
            <h3>Crear Nueva Categoría</h3>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input
                  type="text"
                  className="form-input"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="Nombre de la categoría"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <input
                  type="text"
                  className="form-input"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="Descripción de la categoría"
                />
              </div>
            </div>
            <button onClick={handleCreateCategory} className="btn btn-primary">
              <Plus size={16} />
              Crear Categoría
            </button>
          </div>

          <div className="grid grid-2">
            {categories.map((category) => (
              <div key={category.id} className="card">
                {editingCategory?.id === category.id ? (
                  <div>
                    <input
                      type="text"
                      className="form-input mb-2"
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    />
                    <input
                      type="text"
                      className="form-input mb-2"
                      value={editingCategory.description}
                      onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={handleUpdateCategory} className="btn btn-primary">
                        <Save size={16} />
                        Guardar
                      </button>
                      <button onClick={() => setEditingCategory(null)} className="btn btn-secondary">
                        <X size={16} />
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4>{category.name}</h4>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      {category.description}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => setEditingCategory(category)} 
                        className="btn btn-secondary"
                      >
                        <Edit size={16} />
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(category.id)} 
                        className="btn btn-secondary"
                        style={{ background: 'var(--error)', color: 'white' }}
                      >
                        <Trash2 size={16} />
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <div className="card">
            <h3>Usuarios Registrados</h3>
            <div className="grid grid-2">
              {users.map((user) => (
                <div key={user.id} className="card">
                  <h4>{user.username}</h4>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Registrado: {new Date(user.created_at).toLocaleDateString()}
                  </p>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Catas enviadas: {user.rating_count || 0}
                  </p>
                  <div className="badge badge-primary">
                    {user.is_admin ? 'Administrador' : 'Usuario'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPanel 