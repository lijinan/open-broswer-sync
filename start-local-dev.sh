#!/bin/bash

echo "🚀 启动本地开发环境..."

# 检查PostgreSQL连接
echo "🔍 检查本地PostgreSQL..."
if ! pg_isready -h localhost -p 5432 -U postgres >/dev/null 2>&1; then
    echo "❌ 无法连接到PostgreSQL"
    echo "   请确保PostgreSQL已启动，用户postgres，密码123456"
    exit 1
fi

echo "✅ PostgreSQL连接正常"

# 初始化数据库
echo "📊 初始化数据库..."
PGPASSWORD=123456 psql -h localhost -p 5432 -U postgres -d postgres -f setup-database.sql

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js 18+"
    exit 1
fi

# 启动后端开发服务器
echo "🔧 启动后端开发服务器..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "📦 安装后端依赖..."
    npm install
fi

# 创建环境变量文件
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "📝 已创建环境变量文件 backend/.env"
fi

# 后台启动后端
npm run dev &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 5

# 启动前端开发服务器
echo "🎨 启动前端开发服务器..."
cd web-client
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi

# 后台启动前端
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 开发环境启动完成！"
echo ""
echo "📱 访问地址："
echo "   前端开发服务器: http://localhost:3001"
echo "   后端API服务器: http://localhost:3000"
echo ""
echo "💡 提示："
echo "   - 前端和后端会自动重载"
echo "   - 按Ctrl+C停止所有服务"
echo "   - 数据库: localhost:5432/bookmark_sync"
echo ""

# 等待用户中断
trap "echo '🛑 停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

# 保持脚本运行
wait