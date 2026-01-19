import React, { createContext, useContext, useState, useEffect } from 'react'
import { ConfigProvider, theme } from 'antd'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // 从localStorage读取主题设置，默认为浅色模式
    const saved = localStorage.getItem('theme')
    if (saved) {
      return saved === 'dark'
    }
    // 检查系统主题偏好
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // 切换主题
  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newTheme = !prev
      localStorage.setItem('theme', newTheme ? 'dark' : 'light')
      return newTheme
    })
  }

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => {
      // 只有在没有手动设置主题时才跟随系统
      if (!localStorage.getItem('theme')) {
        setIsDarkMode(e.matches)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Ant Design主题配置
  const themeConfig = {
    algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: '#1890ff',
      borderRadius: 6,
      ...(isDarkMode ? {
        colorBgContainer: '#141414',
        colorBgElevated: '#1f1f1f',
        colorBgLayout: '#000000',
        colorText: 'rgba(255, 255, 255, 0.85)',
        colorTextSecondary: 'rgba(255, 255, 255, 0.65)',
        colorBorder: '#434343',
      } : {})
    },
    components: {
      Layout: {
        siderBg: isDarkMode ? '#001529' : '#001529',
        triggerBg: isDarkMode ? '#1f1f1f' : '#ffffff',
      },
      Menu: {
        darkItemBg: isDarkMode ? '#001529' : '#001529',
        darkItemSelectedBg: '#1890ff',
        darkItemHoverBg: 'rgba(24, 144, 255, 0.2)',
      }
    }
  }

  const value = {
    isDarkMode,
    toggleTheme,
    themeConfig
  }

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider theme={themeConfig}>
        <div className={isDarkMode ? 'dark-theme' : 'light-theme'}>
          {children}
        </div>
      </ConfigProvider>
    </ThemeContext.Provider>
  )
}