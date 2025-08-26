import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import RatingForm from './components/RatingForm'
import Results from './components/Results'
import AdminPanel from './components/AdminPanel'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import './App.css'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <>
      <Header />
      <main className="main-content">
        <div className="container">
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/rate/:itemId" element={user ? <RatingForm /> : <Navigate to="/login" />} />
            <Route path="/results" element={user ? <Results /> : <Navigate to="/login" />} />
            <Route path="/admin" element={user?.isAdmin ? <AdminPanel /> : <Navigate to="/dashboard" />} />
            <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
          </Routes>
        </div>
      </main>
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App 