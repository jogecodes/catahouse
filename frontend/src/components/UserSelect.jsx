import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

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

export default function UserSelect() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API_BASE}?action=config`)
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
        setUsers(data.users || [])
        setLoading(false)
      })
      .catch(err => {
        setError('No se pudieron cargar los usuarios')
        setLoading(false)
      })
  }, [])

  function onSelect(userId) {
    const user = users.find(u => u.id === userId)
    const displayName = user?.name || toTitleCase(userId)
    localStorage.setItem('selectedUser', userId)
    localStorage.setItem('selectedUserName', displayName)
    navigate('/rate')
  }

  const currentId = localStorage.getItem('selectedUser') || ''
  const storedName = localStorage.getItem('selectedUserName') || ''
  const mappedName = users.find(u => u.id === currentId)?.name
  const currentName = mappedName || storedName || toTitleCase(currentId)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">¿Quién eres?</h2>
        {currentId && (
          <div className="mt-1 text-sm text-slate-600">Actual: <strong>{currentName}</strong></div>
        )}
      </div>
      {loading && <div>Cargando usuarios...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {users.map(u => (
          <li key={u.id} className="">
            <button className="w-full text-left border border-slate-200 rounded-lg px-4 py-3 bg-white hover:shadow-sm focus:ring-2 focus:ring-sky-300"
              onClick={() => onSelect(u.id)}>
              <div className="font-medium">{u.name || u.id}</div>
              <div className="text-xs text-slate-500">Pulsa para seleccionar</div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
} 