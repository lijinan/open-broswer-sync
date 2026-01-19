import { useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { message } from 'antd'

const useKeyboardShortcuts = (callbacks = {}) => {
  const navigate = useNavigate()
  const location = useLocation()

  const handleKeyDown = useCallback((event) => {
    // 检查是否在输入框中，如果是则不处理快捷键
    const activeElement = document.activeElement
    const isInputActive = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    )

    // 如果在输入框中，只处理Escape键
    if (isInputActive && event.key !== 'Escape') {
      return
    }

    const { ctrlKey, metaKey, shiftKey, altKey, key } = event
    const isCtrlOrCmd = ctrlKey || metaKey

    // 阻止浏览器默认行为的快捷键
    const shouldPreventDefault = [
      'n', 's', 'f', 'h', 'k', 'j', 'ArrowUp', 'ArrowDown', '/', '?'
    ].includes(key.toLowerCase()) && (isCtrlOrCmd || key === '/' || key === '?')

    if (shouldPreventDefault) {
      event.preventDefault()
    }

    // 全局快捷键
    if (isCtrlOrCmd) {
      switch (key.toLowerCase()) {
        case 'n':
          // Ctrl+N: 新建（根据当前页面）
          if (location.pathname.includes('bookmarks')) {
            callbacks.onNewBookmark?.()
            message.info('快捷键: 新建书签 (Ctrl+N)')
          } else if (location.pathname.includes('passwords')) {
            callbacks.onNewPassword?.()
            message.info('快捷键: 新建密码 (Ctrl+N)')
          }
          break

        case 's':
          // Ctrl+S: 保存
          callbacks.onSave?.()
          message.info('快捷键: 保存 (Ctrl+S)')
          break

        case 'f':
          // Ctrl+F: 搜索
          callbacks.onSearch?.()
          message.info('快捷键: 搜索 (Ctrl+F)')
          break

        case 'h':
          // Ctrl+H: 首页
          navigate('/dashboard')
          message.info('快捷键: 返回首页 (Ctrl+H)')
          break

        case 'k':
          // Ctrl+K: 快速导航
          callbacks.onQuickNav?.()
          message.info('快捷键: 快速导航 (Ctrl+K)')
          break

        case 'e':
          // Ctrl+E: 导入导出
          navigate('/import-export')
          message.info('快捷键: 导入导出 (Ctrl+E)')
          break

        case ',':
          // Ctrl+,: 设置（主题切换）
          callbacks.onToggleTheme?.()
          message.info('快捷键: 切换主题 (Ctrl+,)')
          break

        default:
          break
      }
    }

    // 单键快捷键
    switch (key) {
      case '/':
        // /: 快速搜索
        callbacks.onQuickSearch?.()
        break

      case '?':
        // ?: 显示帮助
        callbacks.onShowHelp?.()
        message.info('快捷键帮助: Ctrl+N(新建) Ctrl+F(搜索) Ctrl+H(首页) Ctrl+K(导航) ?(帮助)')
        break

      case 'Escape':
        // Escape: 取消/关闭
        callbacks.onCancel?.()
        // 如果在输入框中，失去焦点
        if (isInputActive) {
          activeElement.blur()
        }
        break

      case 'j':
        // j: 下一项
        if (!isInputActive) {
          callbacks.onNextItem?.()
        }
        break

      case 'k':
        // k: 上一项
        if (!isInputActive && !isCtrlOrCmd) {
          callbacks.onPrevItem?.()
        }
        break

      case 'Enter':
        // Enter: 确认/打开
        if (!isInputActive && shiftKey) {
          callbacks.onOpen?.()
        }
        break

      default:
        break
    }

    // 数字键快捷键 (1-9)
    if (!isInputActive && !isCtrlOrCmd && /^[1-9]$/.test(key)) {
      const index = parseInt(key) - 1
      callbacks.onSelectItem?.(index)
    }

    // Alt + 数字键: 快速导航
    if (altKey && /^[1-5]$/.test(key)) {
      const routes = ['/dashboard', '/bookmarks', '/passwords', '/import-export']
      const index = parseInt(key) - 1
      if (routes[index]) {
        navigate(routes[index])
        message.info(`快捷键: 导航到页面 ${index + 1} (Alt+${key})`)
      }
    }
  }, [navigate, location.pathname, callbacks])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  // 返回快捷键说明
  const shortcuts = {
    global: [
      { key: 'Ctrl+N', desc: '新建项目' },
      { key: 'Ctrl+F', desc: '搜索' },
      { key: 'Ctrl+H', desc: '返回首页' },
      { key: 'Ctrl+K', desc: '快速导航' },
      { key: 'Ctrl+E', desc: '导入导出' },
      { key: 'Ctrl+,', desc: '切换主题' },
      { key: '/', desc: '快速搜索' },
      { key: '?', desc: '显示帮助' },
      { key: 'Esc', desc: '取消/关闭' },
    ],
    navigation: [
      { key: 'Alt+1', desc: '仪表板' },
      { key: 'Alt+2', desc: '书签管理' },
      { key: 'Alt+3', desc: '密码管理' },
      { key: 'Alt+4', desc: '导入导出' },
    ],
    list: [
      { key: 'j', desc: '下一项' },
      { key: 'k', desc: '上一项' },
      { key: '1-9', desc: '选择项目' },
      { key: 'Shift+Enter', desc: '打开项目' },
    ]
  }

  return { shortcuts }
}

export default useKeyboardShortcuts