#!/bin/bash

# 统一启动脚本
# 用于同时启动前后端服务

# 加载 nvm (如果存在)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 颜色输出定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志文件目录（使用绝对路径）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}    启动前后端服务${NC}"
echo -e "${GREEN}========================================${NC}"

# 清理旧的日志文件
echo -e "${YELLOW}清理旧日志文件...${NC}"
rm -f "$LOG_DIR/backend.log" "$LOG_DIR/frontend.log" "$LOG_DIR/pids.txt"

# 启动后端服务
echo -e "${BLUE}[1/2] 启动后端服务...${NC}"
cd backend || exit 1

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}未检测到后端依赖，正在安装...${NC}"
    npm install
fi

# 检查.env文件
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${RED}请先配置 backend/.env 文件，然后重新运行此脚本${NC}"
        exit 1
    else
        echo -e "${RED}错误: backend/.env.example 文件不存在${NC}"
        exit 1
    fi
fi

# 确定启动模式
if [ "$1" = "--dev" ] || [ "$1" = "-d" ]; then
    # 修复 WSL 中 nodemon 的 UNC 路径问题 - 直接使用 node 运行 nodemon
    BACKEND_CMD="node node_modules/nodemon/bin/nodemon.js src/app.js"
    echo -e "${YELLOW}后端以开发模式启动${NC}"
else
    BACKEND_CMD="npm start"
    echo -e "${YELLOW}后端以生产模式启动${NC}"
fi

# 启动后端（后台运行）
nohup $BACKEND_CMD > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID >> "$LOG_DIR/pids.txt"
cd ..

# 等待后端启动
echo -e "${YELLOW}等待后端服务启动...${NC}"
sleep 3

# 检查后端是否成功启动
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✓ 后端服务启动成功 (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}✗ 后端服务启动失败${NC}"
    echo -e "${YELLOW}查看日志: $LOG_DIR/backend.log${NC}"
    cat "$LOG_DIR/backend.log"
    exit 1
fi

# 启动前端服务
echo -e "${BLUE}[2/2] 启动前端服务...${NC}"
cd web-client || exit 1

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}未检测到前端依赖，正在安装...${NC}"
    npm install
fi

# 确定启动模式
if [ "$1" = "--preview" ] || [ "$1" = "-p" ]; then
    FRONTEND_CMD="npm run build && npm run preview"
    echo -e "${YELLOW}前端以预览模式启动${NC}"
else
    FRONTEND_CMD="npm run dev"
    echo -e "${YELLOW}前端以开发模式启动${NC}"
fi

# 启动前端（后台运行）
nohup $FRONTEND_CMD > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID >> "$LOG_DIR/pids.txt"
cd ..

# 等待前端启动
echo -e "${YELLOW}等待前端服务启动...${NC}"
sleep 3

# 检查前端是否成功启动
if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✓ 前端服务启动成功 (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}✗ 前端服务启动失败${NC}"
    echo -e "${YELLOW}查看日志: $LOG_DIR/frontend.log${NC}"
    cat "$LOG_DIR/frontend.log"
    echo -e "${YELLOW}正在停止后端服务...${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# 显示服务信息
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}    所有服务启动完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${BLUE}后端服务:${NC} PID $BACKEND_PID"
echo -e "${BLUE}前端服务:${NC} PID $FRONTEND_PID"
echo -e "${YELLOW}日志目录:${NC} $LOG_DIR/"
echo -e "${YELLOW}后端日志:${NC} $LOG_DIR/backend.log"
echo -e "${YELLOW}前端日志:${NC} $LOG_DIR/frontend.log"
echo ""
echo -e "${YELLOW}查看实时日志:${NC}"
echo -e "  后端: tail -f $LOG_DIR/backend.log"
echo -e "  前端: tail -f $LOG_DIR/frontend.log"
echo ""
echo -e "${YELLOW}停止所有服务:${NC}"
echo -e "  ./stop-all.sh"
echo -e "${GREEN}========================================${NC}"