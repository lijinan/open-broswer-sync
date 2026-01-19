@echo off
chcp 65001 >nul

echo 🚀 启动书签密码同步应用（使用本地PostgreSQL）...

REM 检查Docker是否安装
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker未安装，请先安装Docker Desktop
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose未安装，请先安装Docker Compose
    pause
    exit /b 1
)

REM 检查PostgreSQL是否运行
echo 🔍 检查本地PostgreSQL服务...
pg_isready -h localhost -p 5432 -U postgres >nul 2>&1
if errorlevel 1 (
    echo ❌ 本地PostgreSQL未运行或无法连接
    echo    请确保PostgreSQL服务已启动，用户名为postgres，密码为123456
    echo    连接信息: localhost:5432
    pause
    exit /b 1
) else (
    echo ✅ PostgreSQL连接正常
)

REM 检查环境变量文件
if not exist "backend\.env" (
    echo 📝 创建环境变量文件...
    copy "backend\.env.example" "backend\.env"
    echo ⚠️  已创建环境变量文件 backend\.env
)

REM 初始化数据库
echo 📊 初始化数据库...
psql -h localhost -p 5432 -U postgres -d postgres -f setup-database.sql >nul 2>&1
if errorlevel 1 (
    echo ⚠️  数据库初始化可能失败，请手动执行: psql -h localhost -p 5432 -U postgres -d postgres -f setup-database.sql
) else (
    echo ✅ 数据库初始化完成
)

REM 启动服务
echo 🐳 启动Docker服务...
docker-compose up -d

REM 等待服务启动
echo ⏳ 等待服务启动...
timeout /t 10 /nobreak >nul

REM 运行数据库迁移
echo 📊 运行数据库迁移...
docker-compose exec -T backend npm run migrate

REM 检查服务状态
echo 🔍 检查服务状态...
docker-compose ps

REM 健康检查
echo 🏥 执行健康检查...
timeout /t 5 /nobreak >nul

curl -f http://localhost:3000/health >nul 2>&1
if errorlevel 1 (
    echo ❌ 后端服务启动失败
    echo    请检查日志: docker-compose logs backend
) else (
    echo ✅ 后端服务运行正常
)

curl -f http://localhost:8080 >nul 2>&1
if errorlevel 1 (
    echo ❌ 前端服务启动失败
    echo    请检查日志: docker-compose logs web
) else (
    echo ✅ 前端服务运行正常
)

echo.
echo 🎉 应用启动完成！
echo.
echo 📱 访问地址：
echo    Web界面: http://localhost:8080
echo    API接口: http://localhost:3000
echo.
echo 📋 管理命令：
echo    查看日志: docker-compose logs -f
echo    停止服务: docker-compose down
echo    重启服务: docker-compose restart
echo.
echo 💾 数据库信息：
echo    主机: localhost:5432
echo    数据库: bookmark_sync
echo    用户: postgres
echo.
echo 📖 更多信息请查看 docs\deployment.md

pause