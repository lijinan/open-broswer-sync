#!/bin/bash

# 重启服务脚本
# 用于重启所有前后端服务

# 颜色输出定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}    重启前后端服务${NC}"
echo -e "${GREEN}========================================${NC}"

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

# 停止所有服务
echo -e "${YELLOW}[1/2] 停止所有服务...${NC}"
./stop-all.sh

# 检查停止是否成功
if [ $? -ne 0 ]; then
    echo -e "${RED}停止服务失败${NC}"
    exit 1
fi

# 等待进程完全退出
echo -e "${YELLOW}等待进程完全退出...${NC}"
sleep 2

# 启动所有服务
echo -e "${YELLOW}[2/2] 启动所有服务...${NC}"
./start-all.sh "$@"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}    重启完成！${NC}"
echo -e "${GREEN}========================================${NC}"
