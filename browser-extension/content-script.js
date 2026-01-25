// 内容脚本 - 处理页面密码表单检测和自动填充
class PasswordManager {
  constructor() {
    this.serverUrl = 'http://localhost:3001'
    this.token = null
    this.autoDetect = true
    this.confirmSave = true
    // 用于存储最近输入的密码数据
    this.recentPasswordData = null
    // 防抖标记，防止重复保存
    this.saveInProgress = false
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

    // 检查并恢复未完成的密码保存对话框
    this.checkPendingPasswordSave()

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

    // 监听页面上的所有点击事件，用于检测非表单登录
    document.addEventListener('click', (event) => {
      this.handlePageClick(event)
    }, true) // 使用捕获阶段，确保在所有元素上都能捕获

    // 监听页面导航（beforeunload），用于保存密码
    window.addEventListener('beforeunload', () => {
      this.handlePageUnload()
    })

    // 监听页面隐藏（用户切换标签或最小化浏览器）
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.handlePageUnload()
      }
    })

    console.log('🎯 表单监听器已设置（包含非表单检测）')
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
        // this.showPageNotification('扩展未登录，请先登录扩展', 'warning')
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

    // 尝试提取密码数据（无论是否在表单中）
    const passwordData = this.extractPasswordFromInput(passwordInput)
    if (passwordData) {
      // 保存最近输入的密码数据
      this.recentPasswordData = passwordData
      console.log('💾 已缓存密码数据，等待登录确认')
    }
  }

  // 处理页面点击事件（用于检测非表单登录）
  async handlePageClick(event) {
    // 如果没有缓存的密码数据，不需要处理
    if (!this.recentPasswordData) {
      return
    }

    const clickedElement = event.target

    // 检查是否点击了登录按钮
    if (this.isLoginButton(clickedElement)) {
      console.log('🖱️ 检测到登录按钮点击')

      // 延迟处理，给登录请求一些时间
      setTimeout(async () => {
        await this.trySavePasswordFromCache()
      }, 500)
    }
  }

  // 处理页面卸载事件
  async handlePageUnload() {
    // 如果有缓存的密码数据，尝试保存
    if (this.recentPasswordData && !this.saveInProgress) {
      console.log('🔄 页面即将卸载，尝试保存密码')
      await this.trySavePasswordFromCache()
    }
  }

  // 从单个密码输入框提取密码数据（不需要表单）
  extractPasswordFromInput(passwordInput) {
    try {
      const password = passwordInput.value

      if (!password || password.length < 3) {
        return null
      }

      // 查找用户名输入框
      let username = ''
      let usernameInput = null

      // 查找策略：
      // 1. 查找同一直接父容器内的用户名输入框
      // 2. 查找同一表单内的用户名输入框（如果有）
      // 3. 查找整个页面中的用户名输入框（备选）

      // 策略1：查找附近的输入框
      const parent = passwordInput.parentElement
      if (parent) {
        const nearbyInputs = parent.querySelectorAll('input[type="text"], input[type="email"]')
        for (const input of nearbyInputs) {
          if (input.value && input.value.trim()) {
            username = input.value.trim()
            usernameInput = input
            break
          }
        }
      }

      // 策略2：如果没找到，查找同一表单（如果有）
      if (!username && passwordInput.form) {
        const formInputs = passwordInput.form.querySelectorAll('input[type="text"], input[type="email"]')
        for (const input of formInputs) {
          if (input.value && input.value.trim()) {
            username = input.value.trim()
            usernameInput = input
            break
          }
        }
      }

      // 策略3：查找整个页面中的用户名输入框
      if (!username) {
        const allInputs = document.querySelectorAll('input[type="text"], input[type="email"]')
        for (const input of allInputs) {
          if (input.value && input.value.trim()) {
            username = input.value.trim()
            usernameInput = input
            break
          }
        }
      }

      const siteName = this.getSiteName()
      const siteUrl = this.getSiteUrl()

      console.log('✅ 从输入框提取密码数据:', {
        siteName,
        siteUrl,
        username: username || '(未找到)',
        passwordLength: password.length
      })

      return {
        siteName,
        siteUrl,
        username,
        password,
        passwordInput,
        usernameInput
      }
    } catch (error) {
      console.error('❌ 提取密码数据失败:', error)
      return null
    }
  }

  // 判断元素是否是登录按钮
  isLoginButton(element) {
    if (!element || !element.tagName) {
      return false
    }

    // 检查是否是按钮或可点击元素
    const clickableTypes = ['BUTTON', 'A', 'INPUT']
    if (!clickableTypes.includes(element.tagName)) {
      return false
    }

    // 获取元素的文本、ID、类名、name等属性
    const text = (element.textContent || element.value || '').toLowerCase()
    const id = (element.id || '').toLowerCase()
    const className = (element.className || '').toLowerCase()
    const name = (element.name || '').toLowerCase()
    const ariaLabel = (element.getAttribute('aria-label') || '').toLowerCase()

    // 登录相关的关键词
    const loginKeywords = [
      'login', 'signin', 'sign-in', 'sign_in', '登录', '登陆',
      'submit', '提交', 'continue', '继续', '进入',
      'auth', 'authenticate', '认证'
    ]

    // 检查是否包含登录关键词
    const combined = `${text} ${id} ${className} ${name} ${ariaLabel}`
    const hasLoginKeyword = loginKeywords.some(keyword =>
      combined.includes(keyword)
    )

    if (hasLoginKeyword) {
      console.log('✅ 识别为登录按钮:', {
        tag: element.tagName,
        text: text.substring(0, 50),
        id,
        className
      })
      return true
    }

    return false
  }

  // 从缓存尝试保存密码
  async trySavePasswordFromCache() {
    if (!this.recentPasswordData || this.saveInProgress) {
      return
    }

    try {
      this.saveInProgress = true
      console.log('💾 尝试从缓存保存密码')

      // 检查是否在扩展环境中
      const isExtensionContext = (typeof chrome !== 'undefined' && chrome.runtime) ||
                                (typeof browser !== 'undefined' && browser.runtime)

      if (!isExtensionContext) {
        console.log('⚠️ 不在扩展环境中，无法保存密码')
        return
      }

      // 检查是否已登录扩展
      if (!this.token) {
        console.log('⚠️ 扩展未登录，跳过密码保存')
        return
      }

      const passwordData = this.recentPasswordData

      if (!passwordData.password) {
        console.log('⚠️ 密码为空，跳过保存')
        return
      }

      // 检查是否已存在相同的密码
      const existingPassword = await this.checkExistingPassword(passwordData.siteUrl, passwordData.username)

      if (existingPassword) {
        console.log('⚠️ 密码已存在，跳过保存')
        // 清除缓存
        this.recentPasswordData = null
        return
      }

      console.log('✅ 准备保存密码到服务器')

      if (this.confirmSave) {
        // 使用持久化的UI对话框（不会因页面跳转而消失）
        this.showPersistentPasswordDialog(passwordData)
      } else {
        // 自动保存
        await this.savePasswordToServer(passwordData)
      }
    } catch (error) {
      console.error('❌ 从缓存保存密码失败:', error)
    } finally {
      this.saveInProgress = false
    }
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
      this.savePasswordToServer(passwordData).then(() => {
        // 保存成功后清除缓存
        this.recentPasswordData = null
      })
    } else {
      // 用户取消，也清除缓存
      this.recentPasswordData = null
    }
  }

  // 显示持久化密码保存对话框（跨页面）
  showPersistentPasswordDialog(passwordData) {
    console.log('🎨 显示持久化密码保存对话框')

    // 先将密码数据保存到 sessionStorage，以便页面跳转后恢复
    const dialogData = {
      siteName: passwordData.siteName,
      siteUrl: passwordData.siteUrl,
      username: passwordData.username,
      password: passwordData.password,
      timestamp: Date.now()
    }
    sessionStorage.setItem('pendingPasswordSave', JSON.stringify(dialogData))

    // 创建持久化对话框
    this.createPersistentDialogUI(passwordData)
  }

  // 创建持久化对话框UI（使用Shadow DOM）
  createPersistentDialogUI(passwordData) {
    // 检查是否已经存在对话框
    if (document.getElementById('password-save-dialog-container')) {
      console.log('⚠️ 对话框已存在')
      return
    }

    // 创建容器
    const container = document.createElement('div')
    container.id = 'password-save-dialog-container'
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    `

    // 使用 Shadow DOM 避免样式冲突
    const shadow = container.attachShadow({ mode: 'open' })

    // 创建对话框内容
    shadow.innerHTML = `
      <style>
        .dialog {
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideIn 0.3s ease-out;
          transition: opacity 0.2s ease-out, transform 0.2s ease-out;
        }

        .dialog.fade-out {
          opacity: 0;
          transform: scale(0.95);
        }

        @keyframes slideIn {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .dialog-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .dialog-icon {
          font-size: 32px;
        }

        .dialog-title {
          font-size: 18px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0;
        }

        .dialog-content {
          margin-bottom: 24px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .info-label {
          color: #666;
          font-size: 14px;
        }

        .info-value {
          color: #1a1a1a;
          font-size: 14px;
          font-weight: 500;
          text-align: right;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .dialog-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-cancel {
          background: #f5f5f5;
          color: #666;
        }

        .btn-cancel:hover {
          background: #e8e8e8;
        }

        .btn-save {
          background: #1890ff;
          color: white;
        }

        .btn-save:hover {
          background: #40a9ff;
        }

        .close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #999;
          padding: 4px;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          color: #666;
        }
      </style>

      <div class="dialog" style="position: relative;">
        <button class="close-btn" id="dialog-close">×</button>
        <div class="dialog-header">
          <div class="dialog-icon">🔐</div>
          <h3 class="dialog-title">保存密码</h3>
        </div>
        <div class="dialog-content">
          <div class="info-row">
            <span class="info-label">网站</span>
            <span class="info-value" title="${this.escapeHtml(passwordData.siteName)}">${this.escapeHtml(passwordData.siteName)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">用户名</span>
            <span class="info-value" title="${this.escapeHtml(passwordData.username || '(无)')}">${this.escapeHtml(passwordData.username || '(无)')}</span>
          </div>
          <div class="info-row">
            <span class="info-label">密码</span>
            <span class="info-value">${'*'.repeat(passwordData.password.length)}</span>
          </div>
        </div>
        <div class="dialog-actions">
          <button class="btn btn-cancel" id="dialog-cancel">不再保存</button>
          <button class="btn btn-save" id="dialog-save">保存</button>
        </div>
      </div>
    `

    // 添加到页面
    document.body.appendChild(container)

    // 绑定事件
    const saveBtn = shadow.getElementById('dialog-save')
    const cancelBtn = shadow.getElementById('dialog-cancel')
    const closeBtn = shadow.getElementById('dialog-close')

    const closeDialog = () => {
      const dialog = shadow.querySelector('.dialog')
      if (dialog) {
        dialog.classList.add('fade-out')
      }
      setTimeout(() => {
        if (container.parentNode) {
          container.parentNode.removeChild(container)
        }
        sessionStorage.removeItem('pendingPasswordSave')
      }, 200)
    }

    saveBtn.addEventListener('click', async () => {
      console.log('✅ 用户确认保存密码')
      await this.savePasswordToServer(passwordData)
      closeDialog()
    })

    cancelBtn.addEventListener('click', () => {
      console.log('❌ 用户取消保存密码')
      this.recentPasswordData = null
      closeDialog()
    })

    closeBtn.addEventListener('click', () => {
      console.log('❌ 用户关闭对话框')
      this.recentPasswordData = null
      closeDialog()
    })

    // 30秒后自动关闭
    setTimeout(() => {
      if (document.body.contains(container)) {
        console.log('⏰ 对话框超时自动关闭')
        closeDialog()
      }
    }, 30000)
  }

  // HTML转义函数
  escapeHtml(text) {
    if (!text) return ''
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  // 检查并恢复未完成的密码保存对话框
  checkPendingPasswordSave() {
    try {
      const pendingData = sessionStorage.getItem('pendingPasswordSave')
      if (pendingData) {
        const data = JSON.parse(pendingData)
        const now = Date.now()

        // 检查是否过期（30秒）
        if (now - data.timestamp < 30000) {
          console.log('🔄 检测到未完成的密码保存，恢复对话框')
          this.createPersistentDialogUI(data)
        } else {
          sessionStorage.removeItem('pendingPasswordSave')
        }
      }
    } catch (error) {
      console.error('❌ 恢复密码保存对话框失败:', error)
    }
  }

  // 保存密码到服务器
  async savePasswordToServer(passwordData) {
    if (!this.token) {
      console.error('❌ 未登录，无法保存密码')
      this.showPageNotification('⚠️ 请先登录插件，再使用密码保存功能', 'warning')
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
          // 清除缓存
          this.recentPasswordData = null
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
        console.log('⚠️ 未登录，无法填充密码')
        this.showPageNotification('⚠️ 请先登录插件，再使用密码填充功能', 'warning')
        return { success: false, message: '未登录' }
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