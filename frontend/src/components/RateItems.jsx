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
          className="w-8 h-8 p-0 border-0 bg-transparent hover:scale-110 transition-transform"
          onClick={() => onChange(value === n ? null : n)}
          type="button"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill={value >= n ? "currentColor" : "none"}
            className={`w-8 h-8 ${value >= n ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-300`}
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.563.563 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" 
            />
          </svg>
        </button>
      ))}
    </div>
  )
}

function SidraSelection({ items, onSelectSidra, ratings }) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight">Elige la sidra a valorar</h2>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {items.map(item => {
          const itemRatings = ratings[item.id] || {}
          const completedCategories = Object.keys(itemRatings).length
          const totalCategories = 5 // Ahora son 5 categorías
          const isComplete = completedCategories === totalCategories
          
          return (
            <button
              key={item.id}
              onClick={() => onSelectSidra(item)}
              className="w-full text-left border border-slate-200 rounded-xl p-4 bg-white hover:shadow-md transition-shadow focus:ring-2 focus:ring-sky-300"
            >
              <div className="font-semibold mb-2">{item.name}</div>
              <div className="text-sm text-slate-600">
                {isComplete ? (
                  <span className="text-green-600">✓ Completada</span>
                ) : (
                  <span className="text-amber-600">
                    {completedCategories}/{totalCategories} categorías
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SidraRating({ sidra, categories, ratings, onBack, onSave }) {
  const [currentRatings, setCurrentRatings] = useState(ratings[sidra.id] || {})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function updateRating(categoryId, value) {
    const newRatings = {
      ...currentRatings,
      [categoryId]: value,
    }
    setCurrentRatings(newRatings)
    
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch(`${API_BASE}?action=setUserRatings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user: localStorage.getItem('selectedUser'), 
          ratings: { [sidra.id]: newRatings } 
        })
      }).then(r => r.json())
      
      if (res.success) {
        setMessage('¡Guardado!')
        setTimeout(() => setMessage(''), 2000)
        onSave(sidra.id, newRatings)
      } else {
        setMessage('Error al guardar')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (_) {
      setMessage('Error al guardar')
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="px-3 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
        >
          ← Volver
        </button>
        <h2 className="text-2xl font-semibold tracking-tight">Valorar: {sidra.name}</h2>
      </div>
      
      <div className="space-y-6">
        {categories.map(cat => (
          <div key={cat.id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
            <div className="mb-3">
              <h3 className="font-semibold text-lg mb-2">{cat.name}</h3>
              <p className="text-sm text-slate-600 italic">{cat.description}</p>
            </div>
            <div className="flex justify-end">
              <StarInput 
                value={currentRatings[cat.id] ?? null} 
                onChange={(v) => updateRating(cat.id, v)} 
              />
            </div>
          </div>
        ))}
      </div>
      
      {message && (
        <div className="mt-4 text-center">
          <span className={`px-3 py-2 rounded-md text-sm ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </span>
        </div>
      )}
    </div>
  )
}

export default function RateItems() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [ratings, setRatings] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedSidra, setSelectedSidra] = useState(null)

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

  function handleSaveSidra(sidraId, newRatings) {
    setRatings(prev => ({
      ...prev,
      [sidraId]: newRatings
    }))
  }

  if (loading) return <div>Cargando...</div>
  if (!user) return <div className="text-red-600">No hay usuario seleccionado</div>

  if (selectedSidra) {
    return (
      <SidraRating
        sidra={selectedSidra}
        categories={categories}
        ratings={ratings}
        onBack={() => setSelectedSidra(null)}
        onSave={handleSaveSidra}
      />
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight">Valorar sidras {user ? `(Usuario: ${userName})` : ''}</h2>
      <SidraSelection 
        items={items} 
        onSelectSidra={setSelectedSidra}
        ratings={ratings}
      />
    </div>
  )
} 