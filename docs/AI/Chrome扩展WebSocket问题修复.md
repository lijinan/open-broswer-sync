# Chrome扩展WebSocket问题修复

## 🐛 问题描述

Chrome扩展在加载时出现以下错误：
1. **ReferenceError: window is not defined** - Service Worker中不存在window对象
2. **WebSocket连接失败** - Service Worker环境下的WebSocket使用方式不同

## 🔧 修复方案

### 1. 创建Service Worker专用的WebSocket管理器

创建了 `websocket-manager-sw.js`，专门为Chrome Manifest V3 Service Worker环境优化：

**主要改进：**
- 移除对 `window` 对象的依赖
- 使用 `self` 作为全局对象
- 直接使用Chrome API，不依赖browser-polyfill
- 优化了错误处理和重连机制

### 2. 更新Chrome背景脚本

修改 `background.js`：
- 导入Service Worker版本的WebSocket管理器
- 使用 `WebSocketManagerSW` 类
- 优化了初始化流程

### 3. 创建测试页面

创建了 `test-chrome-websocket.html` 用于测试：
- 扩展连接测试
- WebSocket状态检查
- 直接WebSocket连接测试

## 📋 测试步骤

### 1. 准备环境
```bash
# 确保后端服务运行
cd backend
npm start

# 确保前端服务运行
cd web-client
npm run dev
```

### 2. 加载Chrome扩展
1. 打开Chrome扩展管理页面 (`chrome://extensions/`)
2. 开启"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `browser-extension` 文件夹
5. 确保使用 `manifest-chrome.json` 作为manifest文件

### 3. 切换到Chrome配置
```bash
# 在browser-extension目录下运行
copy manifest-chrome.json manifest.json
```

### 4. 测试WebSocket连接
1. 打开测试页面：`browser-extension/test/test-chrome-websocket.html`
2. 点击"测试扩展连接"确认扩展正常
3. 点击"检查WebSocket状态"查看连接状态
4. 点击"直接WebSocket测试"进行连接测试

## 🔍 故障排除

### 问题1: 扩展加载失败
**症状：** Chrome提示manifest错误或脚本错误
**解决：**
1. 检查manifest.json是否为Chrome版本
2. 确认所有脚本文件存在
3. 查看Chrome扩展页面的错误信息

### 问题2: WebSocket连接失败
**症状：** 连接状态显示"未连接"或"错误"
**解决：**
1. 确认后端服务正在运行 (`http://localhost:3001`)
2. 检查扩展是否已登录（有有效token）
3. 查看浏览器控制台的WebSocket错误信息
4. 确认防火墙没有阻止WebSocket连接

### 问题3: Service Worker错误
**症状：** 控制台显示"window is not defined"等错误
**解决：**
1. 确认使用的是 `websocket-manager-sw.js`
2. 检查代码中是否还有对 `window` 的引用
3. 使用 `self` 替代 `window` 对象

## 📁 文件结构

```
browser-extension/
├── websocket-manager-sw.js       # Service Worker版WebSocket管理器
├── websocket-manager.js          # 通用版WebSocket管理器（Firefox用）
├── background.js                 # Chrome后台脚本
├── background-firefox.js         # Firefox后台脚本
├── manifest-chrome.json          # Chrome配置
├── manifest-firefox.json         # Firefox配置
└── test/
    ├── test-chrome-websocket.html # Chrome WebSocket测试
    └── test-realtime-sync.html    # 通用实时同步测试
```

## 🔄 切换浏览器配置

### 切换到Chrome
```bash
cd browser-extension
copy manifest-chrome.json manifest.json
```

### 切换到Firefox
```bash
cd browser-extension
copy manifest-firefox.json manifest.json
```

## ✅ 验证修复

修复成功的标志：
1. Chrome扩展加载无错误
2. WebSocket连接状态显示"已连接"
3. 能够收到服务器的心跳响应
4. 书签同步功能正常工作

## 🚀 下一步

1. 测试实时书签同步功能
2. 验证多浏览器间的同步效果
3. 优化错误处理和用户体验
4. 添加更多的调试和监控功能

修复完成后，Chrome扩展应该能够正常连接WebSocket并实现实时同步功能！🎉