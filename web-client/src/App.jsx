import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from 'antd'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Bookmarks from './pages/Bookmarks'
import Passwords from './pages/Passwords'
import ImportExport from './pages/ImportExport'
import AppLayout from './components/Layout/AppLayout'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div>加载中...</div>
  }
  
  return user ? children : <Navigate to="/login" />
}

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div>加载中...</div>
  }
  
  return user ? <Navigate to="/dashboard" /> : children
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Layout style={{ minHeight: '100vh' }}>
          <Routes>
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="bookmarks" element={<Bookmarks />} />
              <Route path="passwords" element={<Passwords />} />
              <Route path="import-export" element={<ImportExport />} />
            </Route>
          </Routes>
        </Layout>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App