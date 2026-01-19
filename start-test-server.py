#!/usr/bin/env python3
import http.server
import socketserver
import os
import webbrowser
from urllib.parse import unquote

PORT = 8080

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.getcwd(), **kwargs)
    
    def end_headers(self):
        # 添加CORS头
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_GET(self):
        # 处理根路径，显示测试文件列表
        if self.path == '/' or self.path == '/index.html':
            self.send_test_index()
        else:
            super().do_GET()
    
    def send_test_index(self):
        test_dir = os.path.join(os.getcwd(), 'browser-extension', 'test')
        
        try:
            files = [f for f in os.listdir(test_dir) if f.endswith('.html')]
            
            html = f"""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>浏览器扩展测试工具</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .container {{
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        .test-file {{
            display: block;
            padding: 15px;
            margin: 10px 0;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            text-decoration: none;
            color: #333;
            transition: background-color 0.2s;
        }}
        .test-file:hover {{
            background-color: #e9ecef;
        }}
        .test-file h3 {{
            margin: 0 0 5px 0;
            color: #007bff;
        }}
        .test-file p {{
            margin: 0;
            color: #666;
            font-size: 14px;
        }}
        .info {{
            background-color: #d1ecf1;
            border: 1px solid #bee5eb;
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 浏览器扩展测试工具</h1>
        
        <div class="info">
            <h4>📋 使用说明</h4>
            <p>1. 确保后端服务器运行在 http://localhost:3001</p>
            <p>2. 确保浏览器扩展已安装并登录</p>
            <p>3. 选择下面的测试工具进行功能验证</p>
        </div>
        
        <p>选择一个测试工具来验证扩展功能：</p>
"""
            
            descriptions = {
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
            }
            
            for file in sorted(files):
                name = file.replace('.html', '')
                description = descriptions.get(name, '测试工具')
                html += f"""
        <a href="/browser-extension/test/{file}" class="test-file">
            <h3>{name}</h3>
            <p>{description}</p>
        </a>
"""
            
            html += """
    </div>
</body>
</html>
"""
            
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(html.encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(f'Error reading test files: {str(e)}'.encode('utf-8'))

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
        print(f"🧪 测试文件服务器运行在 http://localhost:{PORT}")
        print(f"📁 静态文件路径: {os.getcwd()}")
        print(f"🔗 访问测试工具: http://localhost:{PORT}")
        print("按 Ctrl+C 停止服务器")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n服务器已停止")