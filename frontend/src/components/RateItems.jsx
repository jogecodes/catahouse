import React, { useEffect, useMemo, useState } from 'react'

const API_BASE = '/php-backend/api.php'

function toTitleCase(str) {
  if (!str) return ''
  return String(str)
    .replace(/[-_]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ')
}

function StarInput({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          className={`w-9 h-9 rounded-md border border-slate-200 ${value >= n ? 'bg-yellow-300' : 'bg-white'} hover:bg-yellow-200`}
          onClick={() => onChange(n)}
          type="button"
        >
          {n}
        </button>
      ))}
      <button className="w-9 h-9 rounded-md border border-slate-200 hover:bg-slate-100" onClick={() => onChange(null)} type="button">×</button>
    </div>
  )
}

export default function RateItems() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [ratings, setRatings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const user = localStorage.getItem('selectedUser') || ''
  const userNameStored = localStorage.getItem('selectedUserName') || ''
  const userName = userNameStored || toTitleCase(user)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const config = await fetch(`${API_BASE}?action=config`).then(r => r.json())
      const userRatings = user ? await fetch(`${API_BASE}?action=getUserRatings&user=${encodeURIComponent(user)}`).then(r => r.json()) : { ratings: {} }
      setItems(config.items || [])
      setCategories(config.categories || [])
      setRatings(userRatings.ratings || {})
      setLoading(false)
    }
    load().catch(() => setLoading(false))
  }, [user])

  function updateRating(itemId, categoryId, value) {
    setRatings(prev => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {}),
        [categoryId]: value,
      }
    }))
  }

  async function save() {
    if (!user) {
      setMessage('Selecciona un usuario primero')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch(`${API_BASE}?action=setUserRatings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, ratings })
      }).then(r => r.json())
      if (res.success) setMessage('¡Guardado!')
      else setMessage('Error al guardar')
    } catch (_) {
      setMessage('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div>Cargando...</div>

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight">Valorar ítems {user ? `(Usuario: ${userName})` : ''}</h2>
      {!user && <div className="text-red-600">No hay usuario seleccionado</div>}
      <div className="grid gap-4 md:grid-cols-2">
        {items.map(item => (
          <div key={item.id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
            <h3 className="font-semibold mb-3">{item.name}</h3>
            <div className="space-y-2">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between gap-4">
                  <div className="text-sm text-slate-700">{cat.name}</div>
                  <StarInput value={(ratings[item.id]||{})[cat.id] ?? null} onChange={(v) => updateRating(item.id, cat.id, v)} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-3">
        <button className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 hover:bg-slate-100 disabled:opacity-50" onClick={save} disabled={saving}>Guardar</button>
        {message && <span className="text-slate-600">{message}</span>}
      </div>
    </div>
  )
} 