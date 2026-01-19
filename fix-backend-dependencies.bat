@echo off
echo ========================================
echo    修复后端依赖问题
echo ========================================
echo.

echo 正在进入后端目录...
cd backend

echo 正在安装缺失的依赖包...
npm install ws@^8.14.2

echo.
echo 正在安装所有依赖...
npm install

echo.
echo ✅ 依赖安装完成！
echo.
echo 现在可以启动后端服务:
echo    npm start
echo.
pause