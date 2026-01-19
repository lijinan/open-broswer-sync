# 本地启动指南

## 当前运行状态

✅ **后端服务**: http://localhost:3001 (已启动)
✅ **前端服务**: http://localhost:3002 (已启动)

## 访问应用

1. **打开浏览器访问**: http://localhost:3002
2. **注册新账号**或**登录现有账号**
3. **开始使用书签和密码管理功能**

## 数据库初始化

如果这是第一次运行，需要初始化数据库：

### 方法1: 使用psql命令行
```bash
# 连接到PostgreSQL并创建数据库
psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE IF NOT EXISTS bookmark_sync;"

# 初始化表结构
psql -h localhost -p 5432 -U postgres -d bookmark_sync -f init-db.sql
```

### 方法2: 使用PostgreSQL图形界面工具
1. 打开pgAdmin或其他PostgreSQL管理工具
2. 连接到本地PostgreSQL服务器 (localhost:5432, 用户: postgres, 密码: 123456)
3. 创建数据库 `bookmark_sync`
4. 在该数据库中执行 `init-db.sql` 文件中的SQL语句

## 功能测试

### 1. 用户注册/登录
- 访问 http://localhost:3002
- 点击"立即注册"创建新账号
- 或使用现有账号登录

### 2. 书签管理
- 在仪表板点击"管理书签"
- 添加、编辑、删除书签
- 测试搜索功能

### 3. 密码管理
- 在仪表板点击"管理密码"
- 添加、编辑、删除密码
- 测试密码显示/隐藏功能
- 测试复制功能

## API测试

后端API健康检查：
```bash
curl http://localhost:3001/health
```

应该返回：
```json
{"status":"ok","timestamp":"2026-01-17T..."}
```

## 停止服务

要停止服务，在各自的终端窗口中按 `Ctrl+C`

## 故障排除

### 端口冲突
如果遇到端口占用问题：
- 后端端口3001被占用：修改 `backend/.env` 中的 `PORT` 值
- 前端端口3002被占用：修改 `web-client/vite.config.js` 中的 `port` 值

### 数据库连接问题
1. 确保PostgreSQL服务正在运行
2. 检查连接参数：localhost:5432, postgres/123456
3. 确保数据库 `bookmark_sync` 已创建

### 前端无法连接后端
1. 检查后端服务是否正常运行
2. 检查 `web-client/vite.config.js` 中的代理配置
3. 确保防火墙没有阻止端口访问

## 开发模式特性

- **热重载**: 修改代码后自动重启/刷新
- **实时日志**: 在终端中查看请求和错误日志
- **开发工具**: 浏览器开发者工具可用于调试