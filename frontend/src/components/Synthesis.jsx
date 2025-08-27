import React, { useEffect, useMemo, useState } from 'react'

const API_BASE = '/php-backend/api.php'

export default function Synthesis() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}?action=synthesis`).then(r => r.json()).then(d => {
      setData(d)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div>Cargando...</div>
  if (!data?.success) return <div>Error al cargar</div>

  const categories = data.categories || []
  const items = data.items || []

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight">Ranking</h2>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="border-b border-slate-200 px-3 py-2 text-left">Puesto</th>
              <th className="border-b border-slate-200 px-3 py-2 text-left">Sidra</th>
              {categories.map(cat => (
                <th key={cat.id} className="border-b border-slate-200 px-3 py-2 text-left">{cat.name}</th>
              ))}
              <th className="border-b border-slate-200 px-3 py-2 text-left">Global</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={it.itemId} className="odd:bg-white even:bg-slate-50">
                <td className="px-3 py-2">{idx + 1}</td>
                <td className="px-3 py-2">{it.name}</td>
                {categories.map(cat => (
                  <td key={cat.id} className="px-3 py-2">{it.averages?.[cat.id]?.toFixed ? it.averages[cat.id].toFixed(2) : '-'}</td>
                ))}
                <td className="px-3 py-2 font-semibold">{it.overall?.toFixed ? it.overall.toFixed(2) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 