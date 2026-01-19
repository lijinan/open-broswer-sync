@echo off
echo ========================================
echo    书签密码同步助手 - 服务启动器
echo ========================================
echo.

echo 检查后端依赖...
cd backend
if not exist "node_modules\ws" (
    echo ⚠️ 检测到缺失依赖，正在安装...
    npm install
    echo.
)

echo 正在启动后端服务...
start "后端服务" cmd /k "echo 启动后端服务... && npm start"

cd ..

echo 等待后端服务启动...
timeout /t 5 /nobreak >nul

echo 正在启动前端服务...
start "前端服务" cmd /k "cd web-client && echo 启动前端服务... && npm run dev"

echo.
echo ✅ 所有服务启动命令已执行！
echo.
echo 📋 服务地址:
echo    后端API: http://localhost:3001
echo    前端界面: http://localhost:3002
echo    WebSocket: ws://localhost:3001/ws
echo.
echo 💡 提示:
echo    - 等待几秒钟让服务完全启动
echo    - 如果端口被占用，请先关闭占用的程序
echo    - 启动完成后可以重新加载Chrome扩展
echo.
echo 🔍 测试工具:
echo    - 后端状态: browser-extension/test/test-backend-status.html
echo    - WebSocket测试: browser-extension/test/test-chrome-websocket.html
echo.
pause