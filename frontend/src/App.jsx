import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Tags from './components/Tags'
import Logs from './components/Logs'
import ControleCancela from './components/ControleCancela'
import Dispositivos from './components/Dispositivos'
import UsuariosPortaria from './components/UsuariosPortaria'
import Locais from './components/Locais'
import Portaria from './components/Portaria'
import { verificarToken } from './api/api'

function RotaProtegida({ children }) {
  const [autenticado, setAutenticado] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setAutenticado(false)
      return
    }

    verificarToken()
      .then(() => setAutenticado(true))
      .catch(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
        setAutenticado(false)
      })
  }, [])

  if (autenticado === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-facef-500"></div>
      </div>
    )
  }

  return autenticado ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#fff',
          },
        }}
      />
      <Routes>
        {/* Rota publica da portaria */}
        <Route path="/portaria" element={<Portaria />} />

        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <RotaProtegida>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/tags" element={<Tags />} />
                  <Route path="/logs" element={<Logs />} />
                  <Route path="/controle" element={<ControleCancela />} />
                  <Route path="/locais" element={<Locais />} />
                  <Route path="/dispositivos" element={<Dispositivos />} />
                  <Route path="/operadores" element={<UsuariosPortaria />} />
                </Routes>
              </Layout>
            </RotaProtegida>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
