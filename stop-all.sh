#!/bin/bash

# 停止服务脚本
# 用于停止所有运行中的前后端服务

# 颜色输出定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}    停止前后端服务${NC}"
echo -e "${GREEN}========================================${NC}"

# 日志目录
LOG_DIR="./logs"
PIDS_FILE="$LOG_DIR/pids.txt"

# 方法1: 从pid文件读取并停止
if [ -f "$PIDS_FILE" ]; then
    echo -e "${YELLOW}从PID文件停止服务...${NC}"
    while read -r pid; do
        if [ -n "$pid" ] && ps -p "$pid" > /dev/null 2>&1; then
            kill "$pid"
            echo -e "${GREEN}✓ 已停止进程 PID: $pid${NC}"
        elif [ -n "$pid" ]; then
            echo -e "${YELLOW}PID $pid 的进程不存在，跳过${NC}"
        fi
    done < "$PIDS_FILE"
    rm -f "$PIDS_FILE"
fi

# 方法2: 搜索并停止相关Node进程（作为备份）
echo -e "${YELLOW}检查并停止残留的后端进程...${NC}"
PIDS=$(pgrep -f "node.*backend/src/app.js")
if [ -n "$PIDS" ]; then
    for pid in $PIDS; do
        kill "$pid"
        echo -e "${GREEN}✓ 已停止后端进程 PID: $pid${NC}"
    done
else
    echo -e "${BLUE}未发现运行中的后端进程${NC}"
fi

echo -e "${YELLOW}检查并停止残留的前端进程...${NC}"
PIDS=$(pgrep -f "vite")
if [ -n "$PIDS" ]; then
    for pid in $PIDS; do
        kill "$pid"
        echo -e "${GREEN}✓ 已停止前端进程 PID: $pid${NC}"
    done
else
    echo -e "${BLUE}未发现运行中的前端进程${NC}"
fi

# 方法3: 停止特定端口的进程（作为最后的保障）
echo -e "${YELLOW}检查并停止占用端口的进程...${NC}"

# 检查常见的前端端口 (5173)
FRONTEND_PORT=5173
FRONTEND_PID=$(lsof -ti:$FRONTEND_PORT 2>/dev/null)
if [ -n "$FRONTEND_PID" ]; then
    kill -9 "$FRONTEND_PID" 2>/dev/null
    echo -e "${GREEN}✓ 已停止占用端口 $FRONTEND_PORT 的进程 PID: $FRONTEND_PID${NC}"
fi

# 检查常见的后端端口 (3001)
BACKEND_PORT=3001
BACKEND_PID=$(lsof -ti:$BACKEND_PORT 2>/dev/null)
if [ -n "$BACKEND_PID" ]; then
    kill -9 "$BACKEND_PID" 2>/dev/null
    echo -e "${GREEN}✓ 已停止占用端口 $BACKEND_PORT 的进程 PID: $BACKEND_PID${NC}"
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}    所有服务已停止${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${BLUE}提示: 如需重新启动，请运行 ./start-all.sh${NC}"