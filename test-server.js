const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3003;

// 启用CORS
app.use(cors());

// 提供静态文件服务
app.use('/browser-extension', express.static(path.join(__dirname, 'browser-extension')));

// 根路径重定向到测试文件列表
app.get('/', (req, res) => {
  const fs = require('fs');
  const testDir = path.join(__dirname, 'browser-extension', 'test');
  
  try {
    const files = fs.readdirSync(testDir).filter(file => file.endsWith('.html'));
    
    let html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>浏览器扩展测试工具</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .test-file {
            display: block;
            padding: 15px;
            margin: 10px 0;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            text-decoration: none;
            color: #333;
            transition: background-color 0.2s;
        }
        .test-file:hover {
            background-color: #e9ecef;
        }
        .test-file h3 {
            margin: 0 0 5px 0;
            color: #007bff;
        }
        .test-file p {
            margin: 0;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 浏览器扩展测试工具</h1>
        <p>选择一个测试工具来验证扩展功能：</p>
        
        ${files.map(file => {
          const name = file.replace('.html', '');
          const descriptions = {
            'test-user-info': '用户信息测试 - 验证JWT token和用户信息显示',
            'test-bookmark-duplicate-fix': '书签重复问题修复测试 - 验证书签移动时不会重复',
            'test-firefox-bookmark-sync': 'Firefox书签同步测试 - 验证Firefox书签同步功能',
            'test-url-matching': 'URL匹配逻辑测试 - 验证书签搜索只按URL匹配',
            'test-folder-sync': '文件夹同步测试 - 验证文件夹结构同步',
            'test-cross-browser-move': '跨浏览器移动测试 - 验证书签跨浏览器移动',
            'test-full-sync': '全量同步测试 - 验证浏览器启动时的全量同步',
            'test-bookmark-move-sync': '书签移动同步测试 - 验证书签位置修改同步',
            'test-chrome-websocket': 'Chrome WebSocket测试 - 验证Chrome WebSocket连接',
            'test-websocket-broadcast': 'WebSocket广播测试 - 验证WebSocket消息广播',
            'debug-chrome-sync': 'Chrome同步调试工具 - 调试Chrome同步问题',
            'test-realtime-sync': '实时同步测试 - 验证实时同步功能',
            'test-firefox-sync': 'Firefox同步测试 - 验证Firefox同步功能',
            'test-backend-status': '后端状态测试 - 检查后端服务状态'
          };
          
          const description = descriptions[name] || '测试工具';
          
          return `
            <a href="/browser-extension/test/${file}" class="test-file">
              <h3>${name}</h3>
              <p>${description}</p>
            </a>
          `;
        }).join('')}
    </div>
</body>
</html>
    `;
    
    res.send(html);
  } catch (error) {
    res.status(500).send('Error reading test files: ' + error.message);
  }
});

app.listen(PORT, () => {
  console.log(`🧪 测试文件服务器运行在 http://localhost:${PORT}`);
  console.log(`📁 静态文件路径: ${path.join(__dirname, 'browser-extension')}`);
  console.log(`🔗 访问测试工具: http://localhost:${PORT}`);
});