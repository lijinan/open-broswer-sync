// 扩展设置页面逻辑
class ExtensionOptions {
  constructor() {
    this.defaultSettings = {
      // 工作模式
      workMode: 'smart', // cooperative, smart, replace (默认智能模式)

      // 服务器设置
      serverUrl: 'http://localhost:3001',
      apiTimeout: 10,

      // 书签设置
      autoBookmarkSave: false,
      overrideBookmarkShortcut: false,
      confirmBookmarkSave: true,
      autoBookmarkCategory: false,

      // 密码设置
      autoPasswordDetect: true,
      interceptPasswordSave: false,
      autoPasswordFill: false,
      confirmPasswordSave: true,

      // 高级设置
      debugMode: false,
      backupReminder: true,
      usageStats: false
    }

    this.init()
  }

  async init() {
    await this.loadSettings()
    this.bindEvents()
    this.updateModeSettings()
  }

  async loadSettings() {
    try {
      const result = await extensionAPI.storage.sync.get(this.defaultSettings)
      
      // 设置工作模式
      const modeRadio = document.querySelector(`input[value="${result.workMode}"]`)
      if (modeRadio) {
        modeRadio.checked = true
        this.selectModeOption(result.workMode)
      }
      
      // 设置服务器配置
      document.getElementById('serverUrl').value = result.serverUrl
      document.getElementById('apiTimeout').value = result.apiTimeout
      
      // 设置开关状态
      this.setToggleState('autoBookmarkSave', result.autoBookmarkSave)
      this.setToggleState('overrideBookmarkShortcut', result.overrideBookmarkShortcut)
      this.setToggleState('confirmBookmarkSave', result.confirmBookmarkSave)
      this.setToggleState('autoBookmarkCategory', result.autoBookmarkCategory)
      
      this.setToggleState('autoPasswordDetect', result.autoPasswordDetect)
      this.setToggleState('interceptPasswordSave', result.interceptPasswordSave)
      this.setToggleState('autoPasswordFill', result.autoPasswordFill)
      this.setToggleState('confirmPasswordSave', result.confirmPasswordSave)
      
      this.setToggleState('debugMode', result.debugMode)
      this.setToggleState('backupReminder', result.backupReminder)
      this.setToggleState('usageStats', result.usageStats)
      
    } catch (error) {
      console.error('加载设置失败:', error)
      this.showMessage('加载设置失败', 'error')
    }
  }

  bindEvents() {
    // 工作模式选择
    document.querySelectorAll('input[name="workMode"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.selectModeOption(e.target.value)
        this.updateModeSettings()
      })
    })
    
    // 模式选项点击
    document.querySelectorAll('.mode-option').forEach(option => {
      option.addEventListener('click', () => {
        const mode = option.dataset.mode
        const radio = option.querySelector('input[type="radio"]')
        radio.checked = true
        this.selectModeOption(mode)
        this.updateModeSettings()
      })
    })
    
    // 开关切换
    document.querySelectorAll('.toggle').forEach(toggle => {
      toggle.addEventListener('click', () => {
        toggle.classList.toggle('active')
      })
    })
    
    // 保存设置
    document.getElementById('saveSettings').addEventListener('click', () => {
      this.saveSettings()
    })
    
    // 重置设置
    document.getElementById('resetSettings').addEventListener('click', () => {
      this.resetSettings()
    })
    
    // 导出设置
    document.getElementById('exportSettings').addEventListener('click', () => {
      this.exportSettings()
    })
    
    // 导入设置
    document.getElementById('importSettings').addEventListener('click', () => {
      this.importSettings()
    })
  }

  selectModeOption(mode) {
    // 移除所有选中状态
    document.querySelectorAll('.mode-option').forEach(option => {
      option.classList.remove('selected')
    })
    
    // 添加选中状态
    const selectedOption = document.querySelector(`[data-mode="${mode}"]`)
    if (selectedOption) {
      selectedOption.classList.add('selected')
    }
  }

  updateModeSettings() {
    const selectedMode = document.querySelector('input[name="workMode"]:checked')?.value
    
    if (!selectedMode) return
    
    // 根据模式自动调整设置
    switch (selectedMode) {
      case 'cooperative':
        // 协作模式 - 保守设置
        this.setToggleState('autoBookmarkSave', false)
        this.setToggleState('overrideBookmarkShortcut', false)
        this.setToggleState('interceptPasswordSave', false)
        this.setToggleState('autoPasswordFill', false)
        break
        
      case 'smart':
        // 智能模式 - 平衡设置
        this.setToggleState('autoBookmarkSave', true)
        this.setToggleState('overrideBookmarkShortcut', true)
        this.setToggleState('interceptPasswordSave', false)
        this.setToggleState('autoPasswordFill', true)
        break
        
      case 'replace':
        // 替换模式 - 激进设置
        this.setToggleState('autoBookmarkSave', true)
        this.setToggleState('overrideBookmarkShortcut', true)
        this.setToggleState('interceptPasswordSave', true)
        this.setToggleState('autoPasswordFill', true)
        break
    }
  }

  setToggleState(id, active) {
    const toggle = document.getElementById(id)
    if (toggle) {
      if (active) {
        toggle.classList.add('active')
      } else {
        toggle.classList.remove('active')
      }
    }
  }

  getToggleState(id) {
    const toggle = document.getElementById(id)
    return toggle ? toggle.classList.contains('active') : false
  }

  async saveSettings() {
    try {
      const settings = {
        // 工作模式
        workMode: document.querySelector('input[name="workMode"]:checked')?.value || 'cooperative',
        
        // 服务器设置
        serverUrl: document.getElementById('serverUrl').value,
        apiTimeout: parseInt(document.getElementById('apiTimeout').value),
        
        // 书签设置
        autoBookmarkSave: this.getToggleState('autoBookmarkSave'),
        overrideBookmarkShortcut: this.getToggleState('overrideBookmarkShortcut'),
        confirmBookmarkSave: this.getToggleState('confirmBookmarkSave'),
        autoBookmarkCategory: this.getToggleState('autoBookmarkCategory'),
        
        // 密码设置
        autoPasswordDetect: this.getToggleState('autoPasswordDetect'),
        interceptPasswordSave: this.getToggleState('interceptPasswordSave'),
        autoPasswordFill: this.getToggleState('autoPasswordFill'),
        confirmPasswordSave: this.getToggleState('confirmPasswordSave'),
        
        // 高级设置
        debugMode: this.getToggleState('debugMode'),
        backupReminder: this.getToggleState('backupReminder'),
        usageStats: this.getToggleState('usageStats')
      }
      
      await extensionAPI.storage.sync.set(settings)
      
      // 通知后台脚本设置已更新
      extensionAPI.runtime.sendMessage({
        type: 'SETTINGS_UPDATED',
        settings: settings
      }).catch(() => {
        // 忽略错误，后台脚本可能未准备好
      })
      
      this.showMessage('设置保存成功！', 'success')
      
    } catch (error) {
      console.error('保存设置失败:', error)
      this.showMessage('保存设置失败', 'error')
    }
  }

  async resetSettings() {
    if (confirm('确定要重置所有设置为默认值吗？')) {
      try {
        await extensionAPI.storage.sync.set(this.defaultSettings)
        await this.loadSettings()
        this.showMessage('设置已重置为默认值', 'success')
      } catch (error) {
        console.error('重置设置失败:', error)
        this.showMessage('重置设置失败', 'error')
      }
    }
  }

  async exportSettings() {
    try {
      const settings = await extensionAPI.storage.sync.get()
      const dataStr = JSON.stringify(settings, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `bookmark-sync-settings-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      
      URL.revokeObjectURL(url)
      this.showMessage('设置导出成功！', 'success')
      
    } catch (error) {
      console.error('导出设置失败:', error)
      this.showMessage('导出设置失败', 'error')
    }
  }

  importSettings() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      
      try {
        const text = await file.text()
        const settings = JSON.parse(text)
        
        // 验证设置格式
        if (typeof settings !== 'object') {
          throw new Error('无效的设置文件格式')
        }
        
        await extensionAPI.storage.sync.set(settings)
        await this.loadSettings()
        
        this.showMessage('设置导入成功！', 'success')
        
      } catch (error) {
        console.error('导入设置失败:', error)
        this.showMessage('导入设置失败: ' + error.message, 'error')
      }
    }
    
    input.click()
  }

  showMessage(text, type = 'success') {
    const messageEl = document.getElementById('statusMessage')
    messageEl.textContent = text
    messageEl.className = `status-message status-${type}`
    messageEl.style.display = 'block'
    
    // 3秒后自动隐藏
    setTimeout(() => {
      messageEl.style.display = 'none'
    }, 3000)
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  new ExtensionOptions()
})

// 测试工具功能
function openTestTool(testFile) {
  // 在新标签页中打开测试工具
  const testUrl = extensionAPI.runtime.getURL(`test/${testFile}`)
  extensionAPI.tabs.create({ url: testUrl })
}

function openFirefoxTest() {
  // 打开Firefox专用测试页面
  const testUrl = extensionAPI.runtime.getURL('firefox-test.html')
  extensionAPI.tabs.create({ url: testUrl })
}