// 扩展弹窗逻辑
class ExtensionPopup {
  constructor() {
    this.serverUrl = 'http://localhost:3001'
    this.token = null
    this.init()
  }

  async init() {
    // 等待API加载
    if (typeof extensionAPI === 'undefined') {
      setTimeout(() => this.init(), 100)
      return
    }
    
    await this.loadSettings()
    await this.checkConnection()
    this.bindEvents()
  }

  async loadSettings() {
    const result = await extensionAPI.storage.sync.get(['serverUrl', 'token', 'autoDetect', 'confirmSave'])
    this.serverUrl = result.serverUrl || 'http://localhost:3001'
    this.token = result.token
    
    // 安全地设置DOM元素值
    const serverUrlEl = document.getElementById('serverUrl')
    if (serverUrlEl) {
      serverUrlEl.value = this.serverUrl
    }
    
    // 设置开关状态
    const autoDetectToggle = document.getElementById('autoDetectToggle')
    const confirmSaveToggle = document.getElementById('confirmSaveToggle')
    
    if (autoDetectToggle && result.autoDetect !== false) {
      autoDetectToggle.classList.add('active')
    }
    if (confirmSaveToggle && result.confirmSave !== false) {
      confirmSaveToggle.classList.add('active')
    }
  }

  async checkConnection() {
    const statusEl = document.getElementById('status')
    const loginForm = document.getElementById('loginForm')
    const mainActions = document.getElementById('mainActions')

    if (!statusEl) {
      console.error('Status element not found')
      return
    }

    try {
      statusEl.innerHTML = '<span class="loading"></span> 检查连接...'
      
      if (!this.token) {
        throw new Error('未登录')
      }

      const response = await fetch(`${this.serverUrl}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        statusEl.textContent = `已连接 - ${data.user.name}`
        statusEl.className = 'status connected'
        if (loginForm) loginForm.classList.add('hidden')
        if (mainActions) mainActions.classList.remove('hidden')
      } else {
        throw new Error('认证失败')
      }
    } catch (error) {
      console.log('Connection check failed:', error.message)
      statusEl.textContent = '未连接 - 请登录'
      statusEl.className = 'status disconnected'
      if (loginForm) loginForm.classList.remove('hidden')
      if (mainActions) mainActions.classList.add('hidden')
    }
  }

  bindEvents() {
    // 登录
    document.getElementById('loginBtn').addEventListener('click', () => this.login())
    
    // 保存书签
    document.getElementById('saveBookmarkBtn').addEventListener('click', () => this.saveBookmark())
    
    // 检测密码
    document.getElementById('detectPasswordBtn').addEventListener('click', () => this.detectPassword())
    
    // 打开面板
    document.getElementById('openDashboardBtn').addEventListener('click', () => this.openDashboard())
    
    // 同步
    document.getElementById('syncBtn').addEventListener('click', () => this.sync())
    
    // 导入浏览器数据
    document.getElementById('importBrowserDataBtn').addEventListener('click', () => this.importBrowserData())

    // 导出到浏览器
    document.getElementById('exportToBrowserBtn').addEventListener('click', () => this.exportToBrowser())

    // 打开设置
    document.getElementById('openSettingsBtn').addEventListener('click', () => this.openSettings())
    
    // 设置开关
    document.getElementById('autoDetectToggle').addEventListener('click', (e) => this.toggleSetting(e, 'autoDetect'))
    document.getElementById('confirmSaveToggle').addEventListener('click', (e) => this.toggleSetting(e, 'confirmSave'))
    
    // 回车登录
    document.getElementById('password').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.login()
    })
  }

  async login() {
    const serverUrl = document.getElementById('serverUrl').value
    const username = document.getElementById('username').value
    const password = document.getElementById('password').value
    const loginBtn = document.getElementById('loginBtn')

    if (!username || !password) {
      this.showMessage('请输入用户名和密码', 'error')
      return
    }

    try {
      loginBtn.innerHTML = '<span class="loading"></span> 登录中...'
      loginBtn.disabled = true

      const response = await fetch(`${serverUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })

      // 检查响应内容类型
      const contentType = response.headers.get('content-type')
      let data
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        // 如果不是JSON响应，获取文本内容
        const text = await response.text()
        console.error('服务器返回非JSON响应:', text)
        throw new Error('服务器连接失败，请检查服务器地址和状态')
      }

      if (response.ok) {
        this.token = data.token
        this.serverUrl = serverUrl
        
        await extensionAPI.storage.sync.set({
          serverUrl: this.serverUrl,
          token: this.token
        })

        this.showMessage('登录成功！', 'success')
        await this.checkConnection()
      } else {
        throw new Error(data.message || '登录失败')
      }
    } catch (error) {
      console.error('登录错误:', error)
      if (error.message.includes('Failed to fetch')) {
        this.showMessage('无法连接到服务器，请检查服务器地址', 'error')
      } else if (error.message.includes('JSON')) {
        this.showMessage('服务器响应格式错误，请检查服务器状态', 'error')
      } else {
        this.showMessage(error.message, 'error')
      }
    } finally {
      loginBtn.innerHTML = '<span class="action-text">登录</span>'
      loginBtn.disabled = false
    }
  }

  async saveBookmark() {
    try {
      const tabs = await extensionAPI.tabs.query({ active: true, currentWindow: true })
      const tab = tabs[0]

      const settings = await extensionAPI.storage.sync.get(['confirmSave'])
      if (settings.confirmSave !== false) {
        const confirmed = confirm(`确定要保存书签到同步收藏夹吗？\n\n标题: ${tab.title}\nURL: ${tab.url}`)
        if (!confirmed) return
      }

      const response = await fetch(`${this.serverUrl}/bookmarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          title: tab.title,
          url: tab.url,
          folder: '同步收藏夹',
          tags: ['扩展保存']
        })
      })

      if (response.ok) {
        this.showMessage('书签保存成功！', 'success')

        // 发送消息到content script显示页面通知
        extensionAPI.tabs.sendMessage(tab.id, {
          type: 'BOOKMARK_SAVED',
          data: { title: tab.title, url: tab.url }
        }).catch(() => {
          // 忽略错误，可能是特殊页面
        })
      } else {
        const error = await response.json()
        throw new Error(error.message || '保存失败')
      }
    } catch (error) {
      this.showMessage(error.message, 'error')
    }
  }

  async detectPassword() {
    try {
      const tabs = await extensionAPI.tabs.query({ active: true, currentWindow: true })
      const tab = tabs[0]
      
      // 向content script发送检测密码的消息
      const response = await extensionAPI.tabs.sendMessage(tab.id, {
        type: 'DETECT_PASSWORD_FORM'
      })

      if (response && response.found) {
        const settings = await extensionAPI.storage.sync.get(['confirmSave'])
        if (settings.confirmSave !== false) {
          const confirmed = confirm(`检测到登录表单，确定要保存密码吗？\n\n网站: ${response.data.siteName}\n用户名: ${response.data.username}`)
          if (!confirmed) return
        }

        const saveResponse = await fetch(`${this.serverUrl}/passwords`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
          },
          body: JSON.stringify({
            site_name: response.data.siteName,
            site_url: response.data.siteUrl,
            username: response.data.username,
            password: response.data.password,
            category: '浏览器扩展'
          })
        })

        if (saveResponse.ok) {
          this.showMessage('密码保存成功！', 'success')
          
          // 发送消息到content script显示页面通知
          extensionAPI.tabs.sendMessage(tab.id, {
            type: 'PASSWORD_SAVED',
            data: response.data
          }).catch(() => {
            // 忽略错误，可能是特殊页面
          })
        } else {
          const error = await saveResponse.json()
          throw new Error(error.message || '保存失败')
        }
      } else {
        this.showMessage('未检测到登录表单', 'warning')
      }
    } catch (error) {
      this.showMessage(error.message, 'error')
    }
  }

  async openDashboard() {
    try {
      const settings = await extensionAPI.storage.sync.get(['token', 'serverUrl'])
      
      if (!settings.token) {
        this.showMessage('请先登录扩展', 'error')
        return
      }

      // 构建带有token的URL，实现自动登录
      const dashboardUrl = `${settings.serverUrl.replace(':3001', ':3002')}?token=${encodeURIComponent(settings.token)}`
      
      console.log('打开管理面板:', dashboardUrl)
      extensionAPI.tabs.create({ url: dashboardUrl })
      
    } catch (error) {
      console.error('打开管理面板失败:', error)
      // 如果出错，使用默认URL
      extensionAPI.tabs.create({ url: 'http://localhost:3002' })
    }
  }

  async openSettings() {
    extensionAPI.runtime.openOptionsPage()
  }

  async sync() {
    try {
      const syncBtn = document.getElementById('syncBtn')
      const originalText = syncBtn.innerHTML
      
      syncBtn.innerHTML = '<span class="loading"></span> 同步中...'
      syncBtn.disabled = true

      // 获取当前工作模式
      const settings = await extensionAPI.storage.sync.get(['workMode', 'token', 'serverUrl'])
      
      if (!settings.token) {
        throw new Error('请先登录')
      }

      // 根据工作模式执行不同的同步逻辑
      switch (settings.workMode) {
        case 'replace':
          await this.syncReplaceMode(settings)
          break
        case 'smart':
          await this.syncSmartMode(settings)
          break
        case 'cooperative':
        default:
          await this.syncCooperativeMode(settings)
          break
      }
      
      this.showMessage('同步完成！', 'success')
    } catch (error) {
      console.error('Sync error:', error)
      this.showMessage('同步失败: ' + error.message, 'error')
    } finally {
      const syncBtn = document.getElementById('syncBtn')
      syncBtn.innerHTML = `
        <svg class="action-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
        </svg>
        <div class="action-text">
          <div class="action-title">立即同步</div>
          <div class="action-desc">同步最新数据</div>
        </div>
      `
      syncBtn.disabled = false
    }
  }

  // 替换模式同步：完全接管浏览器书签
  async syncReplaceMode(settings) {
    console.log('🎯 执行替换模式同步')
    
    // 1. 获取服务器上的书签
    const serverBookmarks = await this.fetchServerBookmarks(settings)
    console.log('📚 获取到服务器书签:', serverBookmarks.length, '个')
    
    // 2. 检查浏览器是否支持书签API
    if (extensionAPI.bookmarks) {
      // 3. 获取浏览器本地书签
      const localBookmarks = await this.fetchLocalBookmarks()
      console.log('🔖 获取到本地书签:', localBookmarks.length, '个')
      
      // 4. 清空浏览器书签（替换模式）
      await this.clearLocalBookmarks()
      console.log('🗑️ 已清空本地书签')
      
      // 5. 将服务器书签同步到浏览器
      await this.syncBookmarksToLocal(serverBookmarks)
      console.log('⬇️ 已同步服务器书签到本地')
    } else {
      console.log('⚠️ 浏览器不支持书签API，跳过本地书签同步')
    }
    
    // 6. 通知用户
    this.showMessage(`替换模式同步完成！同步了 ${serverBookmarks.length} 个书签`, 'success')
  }

  // 智能模式同步：双向同步
  async syncSmartMode(settings) {
    console.log('🧠 执行智能模式同步')
    
    const serverBookmarks = await this.fetchServerBookmarks(settings)
    
    if (extensionAPI.bookmarks) {
      const localBookmarks = await this.fetchLocalBookmarks()
      
      // 智能合并：本地新增的上传到服务器，服务器新增的下载到本地
      const newLocalBookmarks = this.findNewBookmarks(localBookmarks, serverBookmarks)
      const newServerBookmarks = this.findNewBookmarks(serverBookmarks, localBookmarks)
      
      // 上传新的本地书签
      for (const bookmark of newLocalBookmarks) {
        await this.uploadBookmark(bookmark, settings)
      }
      
      // 下载新的服务器书签
      for (const bookmark of newServerBookmarks) {
        await this.createLocalBookmark(bookmark)
      }
      
      console.log(`📤 上传了 ${newLocalBookmarks.length} 个本地书签`)
      console.log(`📥 下载了 ${newServerBookmarks.length} 个服务器书签`)
    }
    
    this.showMessage(`智能同步完成！处理了 ${serverBookmarks.length} 个书签`, 'success')
  }

  // 协作模式同步：仅同步扩展数据
  async syncCooperativeMode(settings) {
    console.log('🤝 执行协作模式同步')
    
    const serverBookmarks = await this.fetchServerBookmarks(settings)
    console.log('📚 同步了扩展书签数据:', serverBookmarks.length, '个')
    
    this.showMessage(`协作模式同步完成！同步了 ${serverBookmarks.length} 个扩展书签`, 'success')
  }

  // 获取服务器书签
  async fetchServerBookmarks(settings) {
    const response = await fetch(`${settings.serverUrl}/bookmarks`, {
      headers: {
        'Authorization': `Bearer ${settings.token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('获取服务器书签失败')
    }
    
    const data = await response.json()
    return data.bookmarks || []
  }

  // 获取本地书签
  async fetchLocalBookmarks() {
    if (!extensionAPI.bookmarks) {
      return []
    }
    
    try {
      const bookmarks = await extensionAPI.bookmarks.search({})
      return bookmarks.filter(b => b.url) // 只返回有URL的书签
    } catch (error) {
      console.error('获取本地书签失败:', error)
      return []
    }
  }

  // 清空本地书签
  async clearLocalBookmarks() {
    if (!extensionAPI.bookmarks) {
      return
    }
    
    try {
      const bookmarks = await extensionAPI.bookmarks.search({})
      for (const bookmark of bookmarks) {
        if (bookmark.url) { // 只删除书签，不删除文件夹
          await extensionAPI.bookmarks.remove(bookmark.id)
        }
      }
    } catch (error) {
      console.error('清空本地书签失败:', error)
    }
  }

  // 同步书签到本地
  async syncBookmarksToLocal(serverBookmarks) {
    if (!extensionAPI.bookmarks) {
      return
    }

    const folderMap = new Map() // 缓存文件夹ID

    for (const bookmark of serverBookmarks) {
      try {
        await this.createLocalBookmark(bookmark, folderMap)
      } catch (error) {
        console.error('创建本地书签失败:', bookmark.title, error)
      }
    }
  }

  // 创建本地书签（支持多级文件夹）
  async createLocalBookmark(bookmark, folderMap = new Map()) {
    if (!extensionAPI.bookmarks) {
      return
    }

    try {
      console.log('开始创建书签:', bookmark.title, 'folder:', bookmark.folder)

      // 确定父文件夹ID
      let parentId = undefined

      // 步骤1：确保"同步收藏夹"根文件夹存在（在书签工具栏下）
      const syncRootPath = '同步收藏夹'
      if (!folderMap.has(syncRootPath)) {
        const toolbarId = await this.getBookmarksMenuRoot() // 获取书签工具栏ID
        console.log('工具栏ID:', toolbarId, '类型:', typeof toolbarId)

        // 搜索是否已存在"同步收藏夹"文件夹
        const searchResults = await extensionAPI.bookmarks.search({
          title: '同步收藏夹'
        })

        console.log('搜索结果数量:', searchResults.length)
        searchResults.forEach((node, i) => {
          console.log(`搜索结果${i}:`, {
            title: node.title,
            id: node.id,
            parentId: node.parentId,
            parentIdType: typeof node.parentId
          })
        })

        // 使用宽松比较来匹配 ID（处理字符串和数字类型差异）
        let syncRootFolder = searchResults.find(node =>
          node.title === '同步收藏夹' &&
          !node.url &&
          String(node.parentId) === String(toolbarId)
        )

        if (!syncRootFolder) {
          // 创建"同步收藏夹"文件夹
          syncRootFolder = await extensionAPI.bookmarks.create({
            title: '同步收藏夹',
            parentId: toolbarId
          })
          console.log('✅ 创建"同步收藏夹"根文件夹, ID:', syncRootFolder.id, 'parentId:', toolbarId)
        } else {
          console.log('✅ 找到已存在的"同步收藏夹"文件夹, ID:', syncRootFolder.id)
        }

        folderMap.set(syncRootPath, syncRootFolder.id)
      }

      // 步骤2：处理书签的folder路径
      if (bookmark.folder) {
        if (bookmark.folder === '同步收藏夹' || bookmark.folder === '') {
          // 直接放在"同步收藏夹"根文件夹下
          parentId = folderMap.get(syncRootPath)
          console.log('书签放在"同步收藏夹"根文件夹下, ID:', parentId)
        } else if (bookmark.folder.startsWith('同步收藏夹 > ')) {
          // 处理"同步收藏夹 > 子文件夹1 > 子文件夹2"的情况
          const remainingPath = bookmark.folder.replace('同步收藏夹 > ', '')
          const folderPath = remainingPath.split(' > ').filter(f => f.trim())

          // 从"同步收藏夹"根文件夹开始
          parentId = folderMap.get(syncRootPath)
          console.log('从"同步收藏夹"开始创建子文件夹, 起始ID:', parentId)

          // 逐级创建子文件夹
          let currentPath = syncRootPath
          for (const folderName of folderPath) {
            currentPath = currentPath ? `${currentPath} > ${folderName}` : folderName

            if (!folderMap.has(currentPath)) {
              const searchResults = await extensionAPI.bookmarks.search({
                title: folderName
              })

              // 在当前父文件夹下查找（使用宽松比较）
              let folderNode = searchResults.find(node =>
                node.title === folderName &&
                !node.url &&
                String(node.parentId) === String(parentId)
              )

              if (!folderNode) {
                folderNode = await extensionAPI.bookmarks.create({
                  title: folderName,
                  parentId: parentId
                })
                console.log('创建子文件夹:', folderName, 'ID:', folderNode.id, 'parentId:', parentId)
              } else {
                console.log('找到已存在的子文件夹:', folderName, 'ID:', folderNode.id)
              }

              folderMap.set(currentPath, folderNode.id)
            }

            parentId = folderMap.get(currentPath)
            console.log('文件夹路径:', currentPath, 'ID:', parentId)
          }
        } else {
          // 其他文件夹格式，也放在"同步收藏夹"下
          console.log('其他文件夹格式，放在"同步收藏夹"下')
          const folderPath = bookmark.folder.split(' > ').filter(f => f.trim())

          parentId = folderMap.get(syncRootPath)
          let currentPath = syncRootPath

          for (const folderName of folderPath) {
            currentPath = currentPath ? `${currentPath} > ${folderName}` : folderName

            if (!folderMap.has(currentPath)) {
              const searchResults = await extensionAPI.bookmarks.search({
                title: folderName
              })

              let folderNode = searchResults.find(node =>
                node.title === folderName &&
                !node.url &&
                String(node.parentId) === String(parentId)
              )

              if (!folderNode) {
                folderNode = await extensionAPI.bookmarks.create({
                  title: folderName,
                  parentId: parentId
                })
                console.log('创建文件夹:', folderName, 'ID:', folderNode.id, 'parentId:', parentId)
              }

              folderMap.set(currentPath, folderNode.id)
            }

            parentId = folderMap.get(currentPath)
          }
        }
      } else {
        // 没有指定文件夹，放在"同步收藏夹"根文件夹下
        parentId = folderMap.get(syncRootPath)
        console.log('无文件夹书签，放在"同步收藏夹"下, ID:', parentId)
      }

      console.log('最终使用的parentId:', parentId)
      console.log('准备创建书签:', bookmark.title, 'URL:', bookmark.url)

      // 验证parentId是否有效
      if (!parentId) {
        console.error('❌ parentId 为空，可能导致书签被创建到错误位置！')
      }

      // 创建书签
      const created = await extensionAPI.bookmarks.create({
        title: bookmark.title,
        url: bookmark.url,
        parentId: parentId
      })

      console.log('✅ 书签创建成功:', {
        id: created.id,
        title: created.title,
        parentId: created.parentId,
        index: created.index
      })
    } catch (error) {
      console.error('创建书签失败:', error)
    }
  }

  // 获取书签工具栏ID（支持 Firefox 和 Chrome）
  async getBookmarksMenuRoot() {
    try {
      // 获取完整的书签树
      const tree = await extensionAPI.bookmarks.getTree()

      console.log('书签树根节点:', {
        title: tree[0]?.title,
        id: tree[0]?.id,
        childrenCount: tree[0]?.children?.length
      })

      if (tree[0] && tree[0].children && tree[0].children.length > 0) {
        // 打印所有子节点信息（用于调试）
        tree[0].children.forEach((child, index) => {
          console.log(`子节点${index}:`, {
            title: child.title,
            id: child.id,
            dateAdded: child.dateAdded
          })
        })

        // Chrome 使用数字 ID: 1=书签栏, 2=其他书签, 0=书签菜单
        // Firefox 使用字符串 ID: toolbar_____=书签工具栏, menu________=书签菜单
        let toolbarNode = tree[0].children.find(child =>
          // Firefox: toolbar_____
          child.id === 'toolbar_____' ||
          // Chrome: 书签栏 (id=1)
          child.id === '1' ||
          child.id === 1
        )

        if (toolbarNode) {
          console.log('✅ 找到书签工具栏节点:', {
            id: toolbarNode.id,
            title: `"${toolbarNode.title}"`,
            index: tree[0].children.findIndex(c => c.id === toolbarNode.id)
          })
          return toolbarNode.id
        }

        // 如果找不到工具栏，尝试找书签菜单（回退方案）
        let menuNode = tree[0].children.find(child =>
          child.id === 'menu________' || // Firefox
          child.id === '0' || child.id === 0 // Chrome
        )

        if (menuNode) {
          console.log('⚠️ 未找到工具栏，使用书签菜单节点:', {
            id: menuNode.id,
            title: `"${menuNode.title}"`
          })
          return menuNode.id
        }

        // 最后的回退：使用第一个子节点
        const firstChild = tree[0].children[0]
        console.log('⚠️ 使用第一个子节点作为默认位置:', firstChild.id, firstChild.title)
        return firstChild.id
      }

      console.warn('未找到书签节点')
      return null
    } catch (error) {
      console.error('查找书签根目录失败:', error)
      return null
    }
  }

  // 查找新书签
  findNewBookmarks(source, target) {
    return source.filter(sourceBookmark => 
      !target.some(targetBookmark => 
        targetBookmark.url === sourceBookmark.url
      )
    )
  }

  // 上传书签到服务器
  async uploadBookmark(bookmark, settings) {
    try {
      const response = await fetch(`${settings.serverUrl}/bookmarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.token}`
        },
        body: JSON.stringify({
          title: bookmark.title,
          url: bookmark.url,
          folder: '浏览器同步',
          tags: ['自动同步']
        })
      })
      
      if (!response.ok) {
        throw new Error('上传书签失败')
      }
    } catch (error) {
      console.error('上传书签失败:', bookmark.title, error)
    }
  }

  async toggleSetting(event, setting) {
    const toggle = event.target
    toggle.classList.toggle('active')
    
    const isActive = toggle.classList.contains('active')
    await extensionAPI.storage.sync.set({ [setting]: isActive })
    
    this.showMessage(`${setting === 'autoDetect' ? '自动检测' : '确认保存'}已${isActive ? '开启' : '关闭'}`, 'info')
  }

  // 导入浏览器数据功能
  async importBrowserData() {
    try {
      const importBtn = document.getElementById('importBrowserDataBtn')
      const originalText = importBtn.innerHTML
      
      // 确认操作
      const confirmed = confirm(
        '⚠️ 警告：此操作将会：\n\n' +
        '1. 获取当前浏览器的所有书签\n' +
        '2. 清空您账号在服务器上的所有数据\n' +
        '3. 将浏览器数据上传到服务器\n\n' +
        '此操作不可撤销！确定要继续吗？'
      )
      
      if (!confirmed) {
        return
      }
      
      // 二次确认
      const doubleConfirmed = confirm(
        '🔴 最后确认：\n\n' +
        '您即将用当前浏览器的数据完全覆盖服务器上的账号数据。\n' +
        '这将删除服务器上的所有书签和密码！\n\n' +
        '确定要继续吗？'
      )
      
      if (!doubleConfirmed) {
        return
      }
      
      importBtn.innerHTML = '<span class="loading"></span> 导入中...'
      importBtn.disabled = true

      const settings = await extensionAPI.storage.sync.get(['token', 'serverUrl'])
      
      if (!settings.token) {
        throw new Error('请先登录')
      }

      console.log('🔄 开始导入浏览器数据')
      
      // 1. 获取浏览器书签
      const browserBookmarks = await this.getAllBrowserBookmarks()
      console.log('📚 获取到浏览器书签:', browserBookmarks.length, '个')
      
      // 2. 获取浏览器保存的密码（如果可能）
      const browserPasswords = await this.getAllBrowserPasswords()
      console.log('🔐 获取到浏览器密码:', browserPasswords.length, '个')
      
      // 3. 清空服务器数据
      await this.clearServerData(settings)
      console.log('🗑️ 已清空服务器数据')
      
      // 4. 上传书签到服务器
      let uploadedBookmarks = 0
      for (const bookmark of browserBookmarks) {
        try {
          await this.uploadBookmarkToServer(bookmark, settings)
          uploadedBookmarks++
        } catch (error) {
          console.error('上传书签失败:', bookmark.title, error)
        }
      }
      console.log('📤 已上传书签:', uploadedBookmarks, '个')
      
      // 5. 上传密码到服务器
      let uploadedPasswords = 0
      for (const password of browserPasswords) {
        try {
          await this.uploadPasswordToServer(password, settings)
          uploadedPasswords++
        } catch (error) {
          console.error('上传密码失败:', password.site_name, error)
        }
      }
      console.log('📤 已上传密码:', uploadedPasswords, '个')
      
      this.showMessage(
        `导入完成！书签: ${uploadedBookmarks}个，密码: ${uploadedPasswords}个`, 
        'success'
      )
      
    } catch (error) {
      console.error('导入浏览器数据失败:', error)
      this.showMessage('导入失败: ' + error.message, 'error')
    } finally {
      const importBtn = document.getElementById('importBrowserDataBtn')
      importBtn.innerHTML = `
        <svg class="action-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z M12,12L16,16H13.5V19H10.5V16H8L12,12Z"/>
        </svg>
        <div class="action-text">
          <div class="action-title">从浏览器导入</div>
          <div class="action-desc">覆盖账号所有数据</div>
        </div>
      `
      importBtn.disabled = false
    }
  }

  // 获取所有浏览器书签（支持多级文件夹，根目录为"同步收藏夹"）
  async getAllBrowserBookmarks() {
    if (!extensionAPI.bookmarks) {
      console.log('⚠️ 浏览器不支持书签API')
      return []
    }

    try {
      // 获取书签树
      const bookmarkTree = await extensionAPI.bookmarks.getTree()
      const bookmarks = []

      // 需要过滤的浏览器默认文件夹名称
      const ignoredFolders = new Set([
        '书签菜单', 'Bookmarks Menu',
        '书签工具栏', 'Bookmarks Bar', 'Favorites Bar',
        '其他书签', 'Other Bookmarks',
        'Mobile Bookmarks',
        '未命名文件夹', 'Untitled',
        '收藏夹栏', 'Favorites Bar'
      ])

      // 递归遍历书签树，保留完整文件夹路径
      const traverseBookmarks = (nodes, folderPath = []) => {
        for (const node of nodes) {
          if (node.url) {
            // 这是一个书签
            // 使用 > 作为多级文件夹的分隔符
            // 根目录固定为"同步收藏夹"
            const folder = folderPath.length > 0
              ? `同步收藏夹 > ${folderPath.join(' > ')}`
              : '同步收藏夹'

            bookmarks.push({
              title: node.title || 'Untitled',
              url: node.url,
              folder: folder,
              tags: ['浏览器导入'],
              description: `导入时间: ${node.dateAdded ? new Date(node.dateAdded).toLocaleString() : new Date().toLocaleString()}`
            })
          } else if (node.children) {
            // 这是一个文件夹，递归遍历
            const folderName = node.title || '未命名文件夹'

            // 跳过浏览器默认的根级文件夹
            if (ignoredFolders.has(folderName)) {
              // 继续遍历子节点，但不添加到路径
              traverseBookmarks(node.children, folderPath)
            } else {
              // 添加到路径并递归
              traverseBookmarks(node.children, [...folderPath, folderName])
            }
          }
        }
      }

      traverseBookmarks(bookmarkTree)
      return bookmarks

    } catch (error) {
      console.error('获取浏览器书签失败:', error)
      return []
    }
  }

  // 获取浏览器密码（模拟，实际上浏览器不允许直接访问密码）
  async getAllBrowserPasswords() {
    // 注意：出于安全考虑，浏览器不允许扩展直接访问保存的密码
    // 这里返回空数组，实际实现可能需要用户手动导出密码文件
    console.log('⚠️ 浏览器密码需要用户手动导出')
    return []
  }

  // 清空服务器数据
  async clearServerData(settings) {
    try {
      // 清空书签
      const bookmarksResponse = await fetch(`${settings.serverUrl}/bookmarks/clear`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${settings.token}`
        }
      })
      
      if (!bookmarksResponse.ok) {
        console.error('清空服务器书签失败')
      }
      
      // 清空密码
      const passwordsResponse = await fetch(`${settings.serverUrl}/passwords/clear`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${settings.token}`
        }
      })
      
      if (!passwordsResponse.ok) {
        console.error('清空服务器密码失败')
      }
      
    } catch (error) {
      console.error('清空服务器数据失败:', error)
      // 不抛出错误，继续执行
    }
  }

  // 上传书签到服务器
  async uploadBookmarkToServer(bookmark, settings) {
    const response = await fetch(`${settings.serverUrl}/bookmarks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.token}`
      },
      body: JSON.stringify(bookmark)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || '上传书签失败')
    }
    
    return await response.json()
  }

  // 上传密码到服务器
  async uploadPasswordToServer(password, settings) {
    const response = await fetch(`${settings.serverUrl}/passwords`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.token}`
      },
      body: JSON.stringify(password)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || '上传密码失败')
    }

    return await response.json()
  }

  // 导出到浏览器功能
  async exportToBrowser() {
    try {
      const exportBtn = document.getElementById('exportToBrowserBtn')
      const originalText = exportBtn.innerHTML

      // 检查浏览器是否支持书签API
      if (!extensionAPI.bookmarks) {
        this.showMessage('当前浏览器不支持书签API', 'error')
        return
      }

      const settings = await extensionAPI.storage.sync.get(['token', 'serverUrl'])

      if (!settings.token) {
        throw new Error('请先登录')
      }

      // 选择导出模式
      const mode = confirm(
        '📤 导出模式选择：\n\n' +
        '点击「确定」：覆盖模式 - 清空浏览器书签后导入\n' +
        '点击「取消」：合并模式 - 保留现有书签，仅添加新书签\n\n' +
        '建议：首次导出使用覆盖模式，后续使用合并模式'
      )

      const exportMode = mode ? 'replace' : 'merge'

      // 二次确认覆盖模式
      if (exportMode === 'replace') {
        const confirmed = confirm(
          '⚠️ 警告：覆盖模式将删除浏览器中的所有现有书签！\n\n' +
          '此操作不可撤销！确定要继续吗？'
        )
        if (!confirmed) {
          return
        }
      }

      exportBtn.innerHTML = '<span class="loading"></span> 导出中...'
      exportBtn.disabled = true

      console.log('🔄 开始导出数据到浏览器')
      console.log('📋 导出模式:', exportMode === 'replace' ? '覆盖模式' : '合并模式')

      // 1. 从服务器获取所有书签
      const serverBookmarks = await this.fetchServerBookmarks(settings)
      console.log('📚 从服务器获取到书签:', serverBookmarks.length, '个')

      // 调试：打印前3个书签的folder信息
      console.log('🔍 书签folder信息（前3个）:')
      serverBookmarks.slice(0, 3).forEach((b, i) => {
        console.log(`  书签${i + 1}: title="${b.title}", folder="${b.folder}"`)
      })

      if (serverBookmarks.length === 0) {
        this.showMessage('服务器上没有书签数据', 'warning')
        return
      }

      // 2. 获取浏览器当前书签（用于合并模式去重）
      let localBookmarks = []
      if (exportMode === 'merge') {
        localBookmarks = await this.fetchLocalBookmarks()
        console.log('🔖 浏览器现有书签:', localBookmarks.length, '个')
      }

      // 3. 执行导出
      let exportedCount = 0
      let skippedCount = 0
      const folderMap = new Map() // 用于缓存文件夹ID，避免重复创建

      if (exportMode === 'replace') {
        // 覆盖模式：清空后创建
        await this.clearLocalBookmarks()
        console.log('🗑️ 已清空浏览器书签')

        // 创建新书签
        for (const bookmark of serverBookmarks) {
          try {
            await this.createLocalBookmark(bookmark, folderMap)
            exportedCount++
          } catch (error) {
            console.error('创建书签失败:', bookmark.title, error)
          }
        }
      } else {
        // 合并模式：只添加不存在的书签
        const localUrls = new Set(localBookmarks.map(b => b.url))

        for (const bookmark of serverBookmarks) {
          if (localUrls.has(bookmark.url)) {
            skippedCount++
            continue
          }

          try {
            await this.createLocalBookmark(bookmark, folderMap)
            exportedCount++
          } catch (error) {
            console.error('创建书签失败:', bookmark.title, error)
          }
        }
      }

      console.log('✅ 导出完成！')
      console.log('📤 新增书签:', exportedCount, '个')
      if (skippedCount > 0) {
        console.log('⏭️ 跳过重复:', skippedCount, '个')
      }

      this.showMessage(
        `导出完成！新增 ${exportedCount} 个书签${skippedCount > 0 ? `，跳过 ${skippedCount} 个重复` : ''}`,
        'success'
      )

    } catch (error) {
      console.error('导出到浏览器失败:', error)
      this.showMessage('导出失败: ' + error.message, 'error')
    } finally {
      const exportBtn = document.getElementById('exportToBrowserBtn')
      exportBtn.innerHTML = `
        <svg class="action-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z M16,11V8H8V11H5L12,18L19,11H16Z"/>
        </svg>
        <div class="action-text">
          <div class="action-title">导出到浏览器</div>
          <div class="action-desc">同步服务器书签到浏览器</div>
        </div>
      `
      exportBtn.disabled = false
    }
  }

  showMessage(message, type = 'info') {
    // 创建临时消息显示
    const messageEl = document.createElement('div')
    messageEl.style.cssText = `
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
      color: white;
      background: ${type === 'success' ? '#52c41a' : type === 'error' ? '#ff4d4f' : type === 'warning' ? '#faad14' : '#1890ff'};
    `
    messageEl.textContent = message
    document.body.appendChild(messageEl)
    
    setTimeout(() => {
      document.body.removeChild(messageEl)
    }, 3000)
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  new ExtensionPopup()
})