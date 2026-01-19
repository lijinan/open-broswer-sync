import React, { createContext, useContext, useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import api from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 检查URL参数中是否有token
    const urlParams = new URLSearchParams(window.location.search)
    const urlToken = urlParams.get('token')
    
    if (urlToken) {
      // 如果URL中有token，使用它进行自动登录
      console.log('检测到URL中的token，进行自动登录')
      Cookies.set('token', urlToken, { expires: 7 })
      api.defaults.headers.common['Authorization'] = `Bearer ${urlToken}`
      
      // 清除URL中的token参数
      const newUrl = new URL(window.location)
      newUrl.searchParams.delete('token')
      window.history.replaceState({}, document.title, newUrl.pathname + newUrl.search)
      
      fetchUser()
    } else {
      // 否则检查cookie中的token
      const token = Cookies.get('token')
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        fetchUser()
      } else {
        setLoading(false)
      }
    }
  }, [])

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data.user)
    } catch (error) {
      console.error('获取用户信息失败:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password })
      const { token, user } = response.data
      
      Cookies.set('token', token, { expires: 7 })
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || '登录失败' 
      }
    }
  }

  const register = async (name, email, password) => {
    try {
      const response = await api.post('/auth/register', { name, email, password })
      const { token, user } = response.data
      
      Cookies.set('token', token, { expires: 7 })
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || '注册失败' 
      }
    }
  }

  const loginWithToken = async (token) => {
    try {
      // 设置token
      Cookies.set('token', token, { expires: 7 })
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      // 验证token并获取用户信息
      const response = await api.get('/auth/me')
      setUser(response.data.user)
      
      return { success: true }
    } catch (error) {
      console.error('Token登录失败:', error)
      logout()
      return { 
        success: false, 
        error: error.response?.data?.error || 'Token无效' 
      }
    }
  }

  const logout = () => {
    Cookies.remove('token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    loginWithToken,
    register,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}