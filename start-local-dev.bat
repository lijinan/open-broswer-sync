@echo off
chcp 65001 >nul

echo 🚀 启动本地开发环境...

REM 检查PostgreSQL连接
echo 🔍 检查本地PostgreSQL...
pg_isready -h localhost -p 5432 -U postgres >nul 2>&1
if errorlevel 1 (
    echo ❌ 无法连接到PostgreSQL
    echo    请确保PostgreSQL已启动，用户postgres，密码123456
    pause
    exit /b 1
)

REM 初始化数据库
echo 📊 初始化数据库...
psql -h localhost -p 5432 -U postgres -d postgres -f setup-database.sql

REM 启动后端开发服务器
echo 🔧 启动后端开发服务器...
start "Backend Dev Server" cmd /k "cd backend && npm install && npm run dev"

REM 等待后端启动
timeout /t 5 /nobreak >nul

REM 启动前端开发服务器
echo 🎨 启动前端开发服务器...
start "Frontend Dev Server" cmd /k "cd web-client && npm install && npm run dev"

echo.
echo 🎉 开发环境启动完成！
echo.
echo 📱 访问地址：
echo    前端开发服务器: http://localhost:3001
echo    后端API服务器: http://localhost:3000
echo.
echo 💡 提示：
echo    - 前端和后端会自动重载
echo    - 关闭命令行窗口即可停止服务
echo    - 数据库: localhost:5432/bookmark_sync

pause