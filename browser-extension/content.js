// 内容脚本 - 在网页中运行
class ExtensionContent {
  constructor() {
    this.init()
  }

  init() {
    // 等待API加载
    if (typeof extensionAPI === 'undefined') {
      setTimeout(() => this.init(), 100)
      return
    }

    // 监听来自popup和background的消息
    extensionAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse)
      return true
    })

    // 页面加载完成后检查表单
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => this.autoDetectForms(), 1000)
      })
    } else {
      setTimeout(() => this.autoDetectForms(), 1000)
    }

    // 监听表单提交
    this.observeFormSubmissions()
  }

  // 检查登录状态
  async isLoggedIn() {
    try {
      const settings = await extensionAPI.runtime.sendMessage({ type: 'GET_SETTINGS' })
      return !!settings.token
    } catch (error) {
      console.error('检查登录状态失败:', error)
      return false
    }
  }

  // 显示未登录提示
  showLoginRequiredNotification() {
    this.showPageNotification('⚠️ 请先登录后再使用密码保存功能', 'warning')
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.type) {
        case 'DETECT_PASSWORD_FORM':
          const formData = this.detectPasswordForm()
          sendResponse(formData)
          break

        case 'DETECT_PASSWORD_FROM_CONTEXT':
          await this.detectPasswordFromContext()
          sendResponse({ success: true })
          break

        case 'AUTO_DETECT_FORMS':
          await this.autoDetectForms()
          sendResponse({ success: true })
          break

        case 'CONFIRM_SAVE_BOOKMARK':
          this.confirmSaveBookmark(request.data)
          sendResponse({ success: true })
          break

        case 'BOOKMARK_SAVED':
          this.showPageNotification('📚 书签保存成功！', 'success')
          sendResponse({ success: true })
          break

        case 'PASSWORD_SAVED':
          this.showPageNotification('🔐 密码保存成功！', 'success')
          sendResponse({ success: true })
          break

        default:
          sendResponse({ error: 'Unknown message type' })
      }
    } catch (error) {
      console.error('Content script error:', error)
      sendResponse({ error: error.message })
    }
  }

  detectPasswordForm() {
    // 查找登录表单
    const forms = document.querySelectorAll('form')
    let bestForm = null
    let bestScore = 0

    for (const form of forms) {
      const score = this.scoreForm(form)
      if (score > bestScore) {
        bestScore = score
        bestForm = form
      }
    }

    if (bestForm && bestScore > 2) {
      const formData = this.extractFormData(bestForm)
      if (formData.username && formData.password) {
        return {
          found: true,
          data: {
            siteName: this.getSiteName(),
            siteUrl: window.location.origin,
            username: formData.username,
            password: formData.password,
            form: bestForm
          }
        }
      }
    }

    return { found: false }
  }

  scoreForm(form) {
    let score = 0
    const inputs = form.querySelectorAll('input')
    
    let hasPassword = false
    let hasUsername = false

    for (const input of inputs) {
      const type = input.type.toLowerCase()
      const name = input.name.toLowerCase()
      const id = input.id.toLowerCase()
      const placeholder = (input.placeholder || '').toLowerCase()

      // 密码字段
      if (type === 'password') {
        hasPassword = true
        score += 3
      }

      // 用户名字段
      if (type === 'text' || type === 'email') {
        if (name.includes('user') || name.includes('email') || name.includes('login') ||
            id.includes('user') || id.includes('email') || id.includes('login') ||
            placeholder.includes('用户') || placeholder.includes('邮箱') || placeholder.includes('账号')) {
          hasUsername = true
          score += 2
        }
      }

      // 提交按钮
      if (type === 'submit' || input.tagName.toLowerCase() === 'button') {
        const text = (input.value || input.textContent || '').toLowerCase()
        if (text.includes('登录') || text.includes('login') || text.includes('sign in')) {
          score += 1
        }
      }
    }

    // 表单必须同时有用户名和密码字段
    if (!hasPassword || !hasUsername) {
      score = 0
    }

    return score
  }

  extractFormData(form) {
    const data = { username: '', password: '' }
    const inputs = form.querySelectorAll('input')

    for (const input of inputs) {
      const type = input.type.toLowerCase()
      const name = input.name.toLowerCase()
      const id = input.id.toLowerCase()

      if (type === 'password' && input.value) {
        data.password = input.value
      } else if ((type === 'text' || type === 'email') && input.value) {
        if (name.includes('user') || name.includes('email') || name.includes('login') ||
            id.includes('user') || id.includes('email') || id.includes('login')) {
          data.username = input.value
        }
      }
    }

    return data
  }

  getSiteName() {
    // 尝试从页面标题获取网站名称
    const title = document.title
    if (title) {
      // 移除常见的后缀
      return title.replace(/\s*[-|–]\s*.+$/, '').trim()
    }
    
    // 从域名获取
    const hostname = window.location.hostname
    return hostname.replace(/^www\./, '')
  }

  async autoDetectForms() {
    try {
      const settings = await extensionAPI.runtime.sendMessage({ type: 'GET_SETTINGS' })
      if (!settings.autoDetect) return

      const formData = this.detectPasswordForm()
      if (formData.found) {
        // 在表单附近显示保存提示
        this.showFormSaveHint(formData.data.form)
      }
    } catch (error) {
      console.error('Auto detect error:', error)
    }
  }

  async showFormSaveHint(form) {
    // 检查是否已经显示过提示
    if (form.querySelector('.extension-save-hint')) return

    // 检查登录状态
    const loggedIn = await this.isLoggedIn()
    if (!loggedIn) {
      console.log('未登录，跳过显示保存密码提示')
      return
    }

    const hint = document.createElement('div')
    hint.className = 'extension-save-hint'
    hint.style.cssText = `
      position: absolute;
      top: -40px;
      right: 0;
      background: #1890ff;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 10000;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      animation: slideDown 0.3s ease;
    `
    hint.innerHTML = '💾 点击保存密码'

    // 添加动画样式
    if (!document.getElementById('extension-animations')) {
      const style = document.createElement('style')
      style.id = 'extension-animations'
      style.textContent = `
        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `
      document.head.appendChild(style)
    }

    hint.addEventListener('click', async () => {
      const formData = this.detectPasswordForm()
      if (formData.found) {
        try {
          await extensionAPI.runtime.sendMessage({
            type: 'SAVE_PASSWORD',
            data: {
              site_name: formData.data.siteName,
              site_url: formData.data.siteUrl,
              username: formData.data.username,
              password: formData.data.password,
              category: '自动检测'
            }
          })
          hint.remove()
        } catch (error) {
          console.error('Save password error:', error)
        }
      }
    })

    // 设置相对定位
    if (getComputedStyle(form).position === 'static') {
      form.style.position = 'relative'
    }

    form.appendChild(hint)

    // 5秒后自动隐藏
    setTimeout(() => {
      if (hint.parentNode) {
        hint.remove()
      }
    }, 5000)
  }

  observeFormSubmissions() {
    // 监听表单提交事件
    document.addEventListener('submit', async (event) => {
      const form = event.target
      if (form.tagName.toLowerCase() !== 'form') return

      try {
        const settings = await extensionAPI.runtime.sendMessage({ type: 'GET_SETTINGS' })
        if (!settings.autoDetect) return

        // 检查登录状态
        if (!settings.token) {
          console.log('未登录，跳过表单提交监听')
          return
        }

        const formData = this.extractFormData(form)
        if (formData.username && formData.password) {
          // 延迟检查登录是否成功
          setTimeout(async () => {
            // 简单检查：如果页面URL改变或者没有错误提示，认为登录成功
            const hasError = document.querySelector('.error, .alert-danger, [class*="error"]')
            if (!hasError) {
              await this.showSavePasswordPrompt({
                siteName: this.getSiteName(),
                siteUrl: window.location.origin,
                username: formData.username,
                password: formData.password
              })
            }
          }, 2000)
        }
      } catch (error) {
        console.error('Form submission observer error:', error)
      }
    })
  }

  async showSavePasswordPrompt(data) {
    // 检查登录状态（虽然调用处已经检查，但为了安全再次检查）
    const loggedIn = await this.isLoggedIn()
    if (!loggedIn) {
      this.showLoginRequiredNotification()
      return
    }

    // 创建保存密码的提示框
    const prompt = document.createElement('div')
    prompt.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border: 1px solid #d9d9d9;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 300px;
      animation: slideIn 0.3s ease;
    `

    prompt.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <div style="width: 32px; height: 32px; background: #1890ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
          🔐
        </div>
        <div>
          <div style="font-weight: 500;">保存密码？</div>
          <div style="font-size: 12px; color: #666;">为 ${data.siteName} 保存登录信息</div>
        </div>
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="savePasswordBtn" style="flex: 1; padding: 6px 12px; background: #1890ff; color: white; border: none; border-radius: 4px; cursor: pointer;">保存</button>
        <button id="cancelPasswordBtn" style="flex: 1; padding: 6px 12px; background: #f5f5f5; color: #666; border: none; border-radius: 4px; cursor: pointer;">取消</button>
      </div>
    `

    // 添加动画样式
    if (!document.getElementById('extension-slide-animations')) {
      const style = document.createElement('style')
      style.id = 'extension-slide-animations'
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `
      document.head.appendChild(style)
    }

    document.body.appendChild(prompt)

    // 绑定事件
    prompt.querySelector('#savePasswordBtn').addEventListener('click', async () => {
      try {
        await extensionAPI.runtime.sendMessage({
          type: 'SAVE_PASSWORD',
          data: {
            site_name: data.siteName,
            site_url: data.siteUrl,
            username: data.username,
            password: data.password,
            category: '登录检测'
          }
        })
        prompt.remove()
      } catch (error) {
        console.error('Save password error:', error)
      }
    })

    prompt.querySelector('#cancelPasswordBtn').addEventListener('click', () => {
      prompt.remove()
    })

    // 10秒后自动隐藏
    setTimeout(() => {
      if (prompt.parentNode) {
        prompt.remove()
      }
    }, 10000)
  }

  async detectPasswordFromContext() {
    // 检查登录状态
    const loggedIn = await this.isLoggedIn()
    if (!loggedIn) {
      this.showLoginRequiredNotification()
      return
    }

    const formData = this.detectPasswordForm()
    if (formData.found) {
      const confirmed = confirm(`检测到登录表单，确定要保存密码吗？\n\n网站: ${formData.data.siteName}\n用户名: ${formData.data.username}`)
      if (confirmed) {
        await extensionAPI.runtime.sendMessage({
          type: 'SAVE_PASSWORD',
          data: {
            site_name: formData.data.siteName,
            site_url: formData.data.siteUrl,
            username: formData.data.username,
            password: formData.data.password,
            category: '右键保存'
          }
        })
      }
    } else {
      alert('未检测到登录表单')
    }
  }

  confirmSaveBookmark(data) {
    const confirmed = confirm(`确定要保存书签吗？\n\n标题: ${data.title}\nURL: ${data.url}`)
    if (confirmed) {
      extensionAPI.runtime.sendMessage({
        type: 'SAVE_BOOKMARK',
        data: {
          title: data.title,
          url: data.url,
          folder: '右键保存',
          tags: ['右键菜单']
        }
      })
    }
  }

  showPageNotification(message, type = 'info') {
    // 在页面上显示通知
    const notification = document.createElement('div')
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#52c41a' : type === 'error' ? '#ff4d4f' : '#1890ff'};
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `
    notification.textContent = message
    
    document.body.appendChild(notification)
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove()
      }
    }, 3000)
  }
}

// 初始化内容脚本
new ExtensionContent()