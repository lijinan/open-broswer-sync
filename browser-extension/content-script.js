// 内容脚本 - 处理页面密码表单检测和自动填充
class PasswordManager {
  constructor() {
    this.serverUrl = 'http://localhost:3001'
    this.token = null
    this.autoDetect = true
    this.confirmSave = true
    this.init()
  }

  async init() {
    // 检查是否在扩展环境中
    const isExtensionContext = (typeof chrome !== 'undefined' && chrome.runtime) || 
                              (typeof browser !== 'undefined' && browser.runtime)
    
    console.log('🔐 密码管理器初始化开始...')
    console.log('🌐 当前页面:', window.location.href)
    console.log('🔧 扩展环境:', isExtensionContext ? '是' : '否')
    
    if (!isExtensionContext) {
      console.log('⚠️ 不在扩展环境中，密码管理器功能受限')
      console.log('💡 提示：要使用完整功能，请通过扩展访问测试页面')
      // 在普通网页环境中，仍然可以设置表单监听器用于演示
      this.setupFormListeners()
      return
    }

    console.log('✅ 检测到扩展环境，初始化完整功能')

    // 设置API兼容性
    const extensionAPI = typeof chrome !== 'undefined' ? chrome : browser
    console.log('🔧 使用API:', typeof chrome !== 'undefined' ? 'Chrome' : 'Firefox')

    // 加载设置
    await this.loadSettings()
    
    // 监听来自扩展的消息
    if (extensionAPI.runtime && extensionAPI.runtime.onMessage) {
      extensionAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('📨 收到扩展消息:', request.type)
        this.handleMessage(request, sender, sendResponse)
        return true
      })
      console.log('✅ 消息监听器已设置')
    }

    // 如果启用自动检测，监听表单提交
    if (this.autoDetect) {
      this.setupFormListeners()
      console.log('✅ 自动检测已启用')
    } else {
      console.log('⚠️ 自动检测已禁用')
    }

    // 页面加载完成后检测密码表单
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.detectPasswordForms()
      })
    } else {
      this.detectPasswordForms()
    }

    console.log('🔐 密码管理器已初始化完成')
  }

  async loadSettings() {
    try {
      console.log('⚙️ 开始加载扩展设置...')
      const extensionAPI = typeof chrome !== 'undefined' ? chrome : browser
      
      if (extensionAPI && extensionAPI.storage && extensionAPI.storage.sync) {
        console.log('✅ 存储API可用，获取设置...')
        const result = await new Promise((resolve) => {
          extensionAPI.storage.sync.get(['serverUrl', 'token', 'autoDetect', 'confirmSave'], resolve)
        })
        
        this.serverUrl = result.serverUrl || 'http://localhost:3001'
        this.token = result.token
        this.autoDetect = result.autoDetect !== false
        this.confirmSave = result.confirmSave !== false
        
        console.log('⚙️ 设置加载完成:', {
          serverUrl: this.serverUrl,
          hasToken: !!this.token,
          autoDetect: this.autoDetect,
          confirmSave: this.confirmSave
        })
        
        if (!this.token) {
          console.log('⚠️ 扩展未登录，密码保存功能将不可用')
        } else {
          console.log('✅ 扩展已登录，密码保存功能可用')
        }
      } else {
        console.log('⚠️ 存储API不可用，使用默认设置')
        console.log('💡 这通常发生在非扩展环境中')
      }
    } catch (error) {
      console.error('❌ 加载设置失败:', error)
    }
  }

  handleMessage(request, sender, sendResponse) {
    switch (request.type) {
      case 'DETECT_PASSWORD_FORM':
        this.detectPasswordForm().then(sendResponse)
        break
        
      case 'AUTO_FILL_PASSWORD':
        this.autoFillPassword(request.data).then(sendResponse)
        break
        
      case 'BOOKMARK_SAVED':
        this.showPageNotification('书签已保存到同步收藏夹', 'success')
        sendResponse({ success: true })
        break
        
      case 'PASSWORD_SAVED':
        this.showPageNotification('密码已保存到密码管理器', 'success')
        sendResponse({ success: true })
        break
        
      default:
        sendResponse({ error: '未知消息类型' })
    }
  }

  // 设置表单监听器
  setupFormListeners() {
    // 监听表单提交
    document.addEventListener('submit', (event) => {
      const form = event.target
      if (form.tagName === 'FORM') {
        this.handleFormSubmit(form)
      }
    })

    // 监听密码字段变化（用于检测密码输入）
    document.addEventListener('input', (event) => {
      const input = event.target
      if (input.type === 'password' && input.value.length > 0) {
        this.handlePasswordInput(input)
      }
    })

    console.log('🎯 表单监听器已设置')
  }

  // 处理表单提交
  async handleFormSubmit(form) {
    try {
      console.log('🔄 开始处理表单提交...')
      
      // 检查是否在扩展环境中
      const isExtensionContext = (typeof chrome !== 'undefined' && chrome.runtime) || 
                                (typeof browser !== 'undefined' && browser.runtime)
      
      if (!isExtensionContext) {
        console.log('⚠️ 不在扩展环境中，无法保存密码到服务器')
        console.log('💡 提示：要使用密码保存功能，请安装并启用浏览器扩展')
        
        // 仍然提取和显示密码数据用于演示
        const passwordData = this.extractPasswordFromForm(form)
        if (passwordData && passwordData.password) {
          console.log('🔐 检测到密码表单数据（仅演示）:', {
            siteName: passwordData.siteName,
            siteUrl: passwordData.siteUrl,
            username: passwordData.username,
            passwordLength: passwordData.password.length
          })
          
          this.showPageNotification('检测到密码表单，但需要安装扩展才能保存', 'warning')
        }
        return
      }
      
      // 检查是否已登录扩展
      if (!this.token) {
        console.log('⚠️ 扩展未登录，跳过密码保存')
        this.showPageNotification('扩展未登录，请先登录扩展', 'warning')
        return
      }
      
      const passwordData = this.extractPasswordFromForm(form)
      
      if (!passwordData) {
        console.log('⚠️ 未提取到密码数据，跳过处理')
        return
      }
      
      if (!passwordData.password) {
        console.log('⚠️ 密码为空，跳过处理')
        return
      }
      
      console.log('🔐 检测到密码表单提交:', {
        siteName: passwordData.siteName,
        siteUrl: passwordData.siteUrl,
        username: passwordData.username,
        passwordLength: passwordData.password.length
      })
      
      // 检查是否已存在相同的密码
      console.log('🔍 检查是否已存在相同密码...')
      const existingPassword = await this.checkExistingPassword(passwordData.siteUrl, passwordData.username)
      
      if (existingPassword) {
        console.log('⚠️ 密码已存在，跳过保存')
        return
      }
      
      console.log('✅ 密码不存在，准备保存')

      if (this.confirmSave) {
        console.log('💬 显示确认对话框')
        // 延迟显示确认对话框，避免阻塞表单提交
        setTimeout(() => {
          this.showPasswordSaveDialog(passwordData)
        }, 1000)
      } else {
        console.log('🚀 自动保存密码')
        // 自动保存
        await this.savePasswordToServer(passwordData)
      }
    } catch (error) {
      console.error('❌ 处理表单提交失败:', error)
    }
  }

  // 处理密码输入
  handlePasswordInput(passwordInput) {
    // 可以在这里添加实时密码强度检测等功能
    console.log('🔑 检测到密码输入')
  }

  // 检测密码表单（用于手动检测）
  async detectPasswordForm() {
    try {
      const forms = document.querySelectorAll('form')
      
      for (const form of forms) {
        const passwordData = this.extractPasswordFromForm(form)
        
        if (passwordData && passwordData.password) {
          return {
            found: true,
            data: passwordData
          }
        }
      }
      
      return { found: false }
    } catch (error) {
      console.error('❌ 检测密码表单失败:', error)
      return { found: false, error: error.message }
    }
  }

  // 从表单中提取密码数据
  extractPasswordFromForm(form) {
    try {
      console.log('🔍 开始提取表单密码数据...')
      const passwordInputs = form.querySelectorAll('input[type="password"]')
      const usernameInputs = form.querySelectorAll('input[type="text"], input[type="email"], input[name*="user"], input[name*="email"], input[name*="login"]')
      
      console.log('📋 找到密码字段:', passwordInputs.length, '个')
      console.log('📋 找到用户名字段:', usernameInputs.length, '个')
      
      if (passwordInputs.length === 0) {
        console.log('⚠️ 未找到密码字段')
        return null
      }

      const passwordInput = passwordInputs[0]
      const password = passwordInput.value

      console.log('🔑 密码长度:', password ? password.length : 0)

      if (!password || password.length < 3) {
        console.log('⚠️ 密码为空或太短，跳过')
        return null
      }

      // 查找用户名字段
      let username = ''
      let usernameInput = null

      console.log('🔍 查找用户名字段...')
      // 优先查找同一表单内的用户名字段
      for (const input of usernameInputs) {
        console.log('📝 检查输入字段:', input.type, input.name, input.value ? '有值' : '无值')
        if (input.value && input.value.trim()) {
          username = input.value.trim()
          usernameInput = input
          console.log('✅ 找到用户名:', username)
          break
        }
      }

      // 如果没找到用户名，尝试查找邮箱字段
      if (!username) {
        console.log('🔍 未找到用户名，尝试查找邮箱字段...')
        const emailInputs = form.querySelectorAll('input[type="email"]')
        for (const input of emailInputs) {
          if (input.value && input.value.trim()) {
            username = input.value.trim()
            usernameInput = input
            console.log('✅ 找到邮箱作为用户名:', username)
            break
          }
        }
      }

      if (!username) {
        console.log('⚠️ 未找到用户名，但仍继续处理')
      }

      // 生成网站信息
      const siteName = this.getSiteName()
      const siteUrl = this.getSiteUrl()

      console.log('🌐 网站信息:', { siteName, siteUrl })

      const result = {
        siteName,
        siteUrl,
        username,
        password,
        form,
        passwordInput,
        usernameInput
      }
      
      console.log('✅ 密码数据提取完成:', {
        siteName: result.siteName,
        siteUrl: result.siteUrl,
        username: result.username,
        hasPassword: !!result.password,
        passwordLength: result.password ? result.password.length : 0
      })

      return result
    } catch (error) {
      console.error('❌ 提取密码数据失败:', error)
      return null
    }
  }

  // 获取网站名称
  getSiteName() {
    // 优先使用页面标题
    let siteName = document.title

    // 如果标题太长，尝试从域名生成
    if (siteName.length > 50) {
      const hostname = window.location.hostname
      siteName = hostname.replace('www.', '').split('.')[0]
      siteName = siteName.charAt(0).toUpperCase() + siteName.slice(1)
    }

    return siteName || window.location.hostname
  }

  // 获取网站URL
  getSiteUrl() {
    return window.location.origin
  }

  // 检查是否已存在相同的密码
  async checkExistingPassword(siteUrl, username) {
    console.log('🔍 检查现有密码:', { siteUrl, username, hasToken: !!this.token })
    
    if (!this.token) {
      console.log('⚠️ 没有token，无法检查现有密码')
      return false
    }

    try {
      // 通过background script检查，避免CORS问题
      const extensionAPI = typeof chrome !== 'undefined' ? chrome : browser
      
      if (extensionAPI && extensionAPI.runtime) {
        console.log('📤 发送检查现有密码请求到background script')
        const response = await new Promise((resolve, reject) => {
          extensionAPI.runtime.sendMessage({
            type: 'CHECK_EXISTING_PASSWORD',
            data: { siteUrl, username }
          }, (response) => {
            if (extensionAPI.runtime.lastError) {
              console.error('❌ Background script通信失败:', extensionAPI.runtime.lastError.message)
              reject(new Error(extensionAPI.runtime.lastError.message))
            } else {
              console.log('📥 收到background script响应:', response)
              resolve(response)
            }
          })
        })

        const exists = response && response.exists
        console.log('🔍 密码存在检查结果:', exists)
        return exists
      } else {
        console.error('❌ 扩展API不可用')
        return false
      }
    } catch (error) {
      console.error('❌ 检查现有密码失败:', error)
      return false
    }
  }

  // 显示密码保存对话框
  showPasswordSaveDialog(passwordData) {
    const confirmed = confirm(
      `🔐 检测到登录信息，是否保存到密码管理器？\n\n` +
      `网站: ${passwordData.siteName}\n` +
      `用户名: ${passwordData.username}\n` +
      `密码: ${'*'.repeat(passwordData.password.length)}`
    )

    if (confirmed) {
      this.savePasswordToServer(passwordData)
    }
  }

  // 保存密码到服务器
  async savePasswordToServer(passwordData) {
    if (!this.token) {
      console.error('❌ 未登录，无法保存密码')
      return
    }

    try {
      // 通过background script发送请求，避免CORS问题
      const extensionAPI = typeof chrome !== 'undefined' ? chrome : browser
      
      if (extensionAPI && extensionAPI.runtime) {
        const response = await new Promise((resolve, reject) => {
          extensionAPI.runtime.sendMessage({
            type: 'SAVE_PASSWORD_TO_SERVER',
            data: {
              site_name: passwordData.siteName,
              site_url: passwordData.siteUrl,
              username: passwordData.username,
              password: passwordData.password,
              category: '自动检测',
              notes: `自动保存于 ${new Date().toLocaleString()}`
            }
          }, (response) => {
            if (extensionAPI.runtime.lastError) {
              reject(new Error(extensionAPI.runtime.lastError.message))
            } else {
              resolve(response)
            }
          })
        })

        if (response && response.success) {
          console.log('✅ 密码保存成功')
          this.showPageNotification('密码已保存到密码管理器', 'success')
        } else {
          throw new Error(response?.error || '保存失败')
        }
      } else {
        throw new Error('扩展API不可用')
      }
    } catch (error) {
      console.error('❌ 保存密码失败:', error)
      this.showPageNotification('密码保存失败: ' + error.message, 'error')
    }
  }

  // 自动填充密码
  async autoFillPassword(data) {
    try {
      if (!this.token) {
        throw new Error('未登录')
      }

      // 获取当前网站的密码
      const passwords = await this.getPasswordsForSite(window.location.origin)
      
      if (passwords.length === 0) {
        this.showPageNotification('未找到当前网站的密码', 'warning')
        return { success: false, message: '未找到密码' }
      }

      // 如果有多个密码，显示选择列表
      let selectedPassword = passwords[0]
      if (passwords.length > 1) {
        selectedPassword = await this.showPasswordSelectionDialog(passwords)
        if (!selectedPassword) {
          return { success: false, message: '用户取消' }
        }
      }

      // 填充表单
      const filled = await this.fillPasswordForm(selectedPassword)
      
      if (filled) {
        this.showPageNotification('密码已自动填充', 'success')
        return { success: true }
      } else {
        this.showPageNotification('未找到可填充的表单', 'warning')
        return { success: false, message: '未找到表单' }
      }
    } catch (error) {
      console.error('❌ 自动填充密码失败:', error)
      this.showPageNotification('自动填充失败: ' + error.message, 'error')
      return { success: false, error: error.message }
    }
  }

  // 获取当前网站的密码
  async getPasswordsForSite(siteUrl) {
    const extensionAPI = typeof chrome !== 'undefined' ? chrome : browser
    
    if (extensionAPI && extensionAPI.runtime) {
      const response = await new Promise((resolve, reject) => {
        extensionAPI.runtime.sendMessage({
          type: 'GET_PASSWORDS_FOR_SITE',
          data: { siteUrl }
        }, (response) => {
          if (extensionAPI.runtime.lastError) {
            reject(new Error(extensionAPI.runtime.lastError.message))
          } else {
            resolve(response)
          }
        })
      })

      return response && response.passwords ? response.passwords : []
    }
    
    throw new Error('扩展API不可用')
  }

  // 显示密码选择对话框
  async showPasswordSelectionDialog(passwords) {
    const options = passwords.map((p, i) => 
      `${i + 1}. ${p.username} (${p.site_name})`
    ).join('\n')

    const choice = prompt(
      `找到多个密码，请选择：\n\n${options}\n\n请输入序号 (1-${passwords.length}):`
    )

    const index = parseInt(choice) - 1
    if (index >= 0 && index < passwords.length) {
      return passwords[index]
    }

    return null
  }

  // 填充密码表单
  async fillPasswordForm(passwordData) {
    try {
      // 获取密码详情（包含实际密码）
      const passwordDetail = await this.getPasswordDetail(passwordData.id)
      if (!passwordDetail) {
        return false
      }

      const forms = document.querySelectorAll('form')
      
      for (const form of forms) {
        const passwordInputs = form.querySelectorAll('input[type="password"]')
        const usernameInputs = form.querySelectorAll('input[type="text"], input[type="email"]')
        
        if (passwordInputs.length > 0) {
          // 填充用户名
          if (usernameInputs.length > 0 && passwordDetail.username) {
            usernameInputs[0].value = passwordDetail.username
            usernameInputs[0].dispatchEvent(new Event('input', { bubbles: true }))
          }
          
          // 填充密码
          passwordInputs[0].value = passwordDetail.password
          passwordInputs[0].dispatchEvent(new Event('input', { bubbles: true }))
          
          return true
        }
      }
      
      return false
    } catch (error) {
      console.error('❌ 填充表单失败:', error)
      return false
    }
  }

  // 获取密码详情
  async getPasswordDetail(passwordId) {
    const extensionAPI = typeof chrome !== 'undefined' ? chrome : browser
    
    if (extensionAPI && extensionAPI.runtime) {
      const response = await new Promise((resolve, reject) => {
        extensionAPI.runtime.sendMessage({
          type: 'GET_PASSWORD_DETAIL',
          data: { passwordId }
        }, (response) => {
          if (extensionAPI.runtime.lastError) {
            reject(new Error(extensionAPI.runtime.lastError.message))
          } else {
            resolve(response)
          }
        })
      })

      return response && response.password ? response.password : null
    }
    
    throw new Error('扩展API不可用')
  }

  // 检测页面上的密码表单
  detectPasswordForms() {
    const forms = document.querySelectorAll('form')
    const passwordForms = []

    forms.forEach(form => {
      const passwordInputs = form.querySelectorAll('input[type="password"]')
      if (passwordInputs.length > 0) {
        passwordForms.push(form)
      }
    })

    if (passwordForms.length > 0) {
      console.log(`🔍 检测到 ${passwordForms.length} 个密码表单`)
      
      // 可以在这里添加视觉提示，比如在密码字段旁边显示自动填充按钮
      this.addAutoFillButtons(passwordForms)
    }
  }

  // 添加自动填充按钮
  addAutoFillButtons(forms) {
    forms.forEach((form, index) => {
      const passwordInput = form.querySelector('input[type="password"]')
      if (passwordInput && !passwordInput.dataset.autoFillAdded) {
        passwordInput.dataset.autoFillAdded = 'true'
        
        // 创建自动填充按钮
        const button = document.createElement('button')
        button.type = 'button'
        button.innerHTML = '🔑'
        button.title = '自动填充密码'
        button.style.cssText = `
          position: absolute;
          right: 5px;
          top: 50%;
          transform: translateY(-50%);
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 16px;
          z-index: 1000;
        `
        
        button.addEventListener('click', () => {
          this.autoFillPassword()
        })
        
        // 将密码输入框设置为相对定位
        const inputRect = passwordInput.getBoundingClientRect()
        const wrapper = document.createElement('div')
        wrapper.style.cssText = `
          position: relative;
          display: inline-block;
          width: ${inputRect.width}px;
        `
        
        passwordInput.parentNode.insertBefore(wrapper, passwordInput)
        wrapper.appendChild(passwordInput)
        wrapper.appendChild(button)
      }
    })
  }

  // 显示页面通知
  showPageNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div')
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      color: white;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: all 0.3s ease;
      background: ${type === 'success' ? '#52c41a' : type === 'error' ? '#ff4d4f' : type === 'warning' ? '#faad14' : '#1890ff'};
    `
    
    notification.textContent = message
    document.body.appendChild(notification)
    
    // 3秒后自动消失
    setTimeout(() => {
      notification.style.opacity = '0'
      notification.style.transform = 'translateX(100%)'
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification)
        }
      }, 300)
    }, 3000)
  }
}

// 初始化密码管理器
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PasswordManager()
  })
} else {
  new PasswordManager()
}