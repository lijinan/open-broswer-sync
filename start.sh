#!/bin/bash

echo "🚀 启动书签密码同步应用..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 检查环境变量文件
if [ ! -f "backend/.env" ]; then
    echo "📝 创建环境变量文件..."
    cp backend/.env.example backend/.env
    echo "⚠️  请编辑 backend/.env 文件，修改默认密钥和配置"
    echo "   特别是以下配置项："
    echo "   - JWT_SECRET"
    echo "   - ENCRYPTION_KEY"
    echo "   - DB_PASSWORD"
    read -p "按回车键继续..."
fi

# 启动服务
echo "🐳 启动Docker服务..."
docker-compose up -d

# 等待数据库启动
echo "⏳ 等待数据库启动..."
sleep 10

# 运行数据库迁移
echo "📊 初始化数据库..."
docker-compose exec -T backend npm run migrate

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

# 健康检查
echo "🏥 执行健康检查..."
sleep 5
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ 后端服务运行正常"
else
    echo "❌ 后端服务启动失败"
fi

if curl -f http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ 前端服务运行正常"
else
    echo "❌ 前端服务启动失败"
fi

echo ""
echo "🎉 应用启动完成！"
echo ""
echo "📱 访问地址："
echo "   Web界面: http://localhost:8080"
echo "   API接口: http://localhost:3000"
echo ""
echo "📋 管理命令："
echo "   查看日志: docker-compose logs -f"
echo "   停止服务: docker-compose down"
echo "   重启服务: docker-compose restart"
echo ""
echo "📖 更多信息请查看 docs/deployment.md"