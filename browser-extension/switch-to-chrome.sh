#!/bin/bash
echo "切换到Chrome配置..."
cp manifest-chrome.json manifest.json
echo "Chrome配置已激活！"
echo "请在Chrome中重新加载扩展。"
read -p "按回车键继续..."