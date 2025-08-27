import './App.css'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import UserSelect from './components/UserSelect.jsx'
import RateItems from './components/RateItems.jsx'
import Synthesis from './components/Synthesis.jsx'
import React from 'react'

function App() {
  const [open, setOpen] = React.useState(false)
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white text-gray-800">
        <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-semibold tracking-tight">Catajús 2025</h1>
            <div className="flex items-center gap-2">
              <button
                className="md:hidden inline-flex items-center justify-center rounded-md border border-slate-300 px-2.5 py-2 text-slate-700 hover:bg-slate-100"
                aria-label="Abrir menú"
                aria-expanded={open}
                onClick={() => setOpen(v => !v)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path fillRule="evenodd" d="M3.75 6.75A.75.75 0 0 1 4.5 6h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75zm0 5.25a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75zm.75 4.5a.75.75 0 0 0 0 1.5h15a.75.75 0 0 0 0-1.5h-15z" clipRule="evenodd" />
                </svg>
              </button>
              <nav className="hidden md:flex gap-2">
                <Link className="px-3 py-1.5 rounded-md hover:bg-slate-100 text-slate-700 border border-slate-200" to="/">Elegir usuario</Link>
                <Link className="px-3 py-1.5 rounded-md hover:bg-slate-100 text-slate-700 border border-slate-200" to="/rate">Valorar sidras</Link>
                <Link className="px-3 py-1.5 rounded-md hover:bg-slate-100 text-slate-700 border border-slate-200" to="/synthesis">Ranking</Link>
              </nav>
            </div>
          </div>
          {open && (
            <div className="md:hidden border-t border-slate-200">
              <nav className="max-w-5xl mx-auto px-4 py-3 flex flex-col gap-2">
                <Link onClick={() => setOpen(false)} className="px-3 py-2 rounded-md hover:bg-slate-100 text-slate-700 border border-slate-200" to="/">Elegir usuario</Link>
                <Link onClick={() => setOpen(false)} className="px-3 py-2 rounded-md hover:bg-slate-100 text-slate-700 border border-slate-200" to="/rate">Valorar sidras</Link>
                <Link onClick={() => setOpen(false)} className="px-3 py-2 rounded-md hover:bg-slate-100 text-slate-700 border border-slate-200" to="/synthesis">Ranking</Link>
              </nav>
            </div>
          )}
        </header>
        <main className="max-w-5xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<UserSelect />} />
            <Route path="/rate" element={<RateItems />} />
            <Route path="/synthesis" element={<Synthesis />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500">
          Hecho con ❤️ para la CasaHouse Adventure 2025
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
