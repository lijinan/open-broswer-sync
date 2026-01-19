# 项目概览

## 功能特性

### 🔖 书签管理
- 浏览器书签导入/导出
- 书签分类和标签管理
- 全文搜索功能
- 跨设备同步

### 🔐 密码管理
- 安全的密码存储
- 密码生成器
- 自动填充支持
- 端到端加密

### 🌐 多端支持
- Web浏览器客户端
- 移动端应用（React Native）
- 浏览器扩展（计划中）
- 桌面应用（计划中）

### 🔒 安全特性
- AES-256加密
- JWT身份认证
- 密码哈希存储
- API限流保护

## 技术架构

### 后端技术栈
- **运行时**: Node.js 18+
- **框架**: Express.js
- **数据库**: PostgreSQL
- **认证**: JWT + bcrypt
- **加密**: crypto-js (AES-256)
- **API文档**: 自动生成

### 前端技术栈
- **框架**: React 18
- **路由**: React Router v6
- **UI库**: Ant Design
- **状态管理**: Context API
- **HTTP客户端**: Axios
- **构建工具**: Vite

### 移动端技术栈
- **框架**: React Native
- **导航**: React Navigation
- **UI库**: React Native Elements
- **状态管理**: Context API

### 部署技术栈
- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx
- **数据库**: PostgreSQL 15
- **监控**: 内置健康检查

## 数据模型

### 用户表 (users)
```sql
id          SERIAL PRIMARY KEY
email       VARCHAR UNIQUE NOT NULL
password    VARCHAR NOT NULL (bcrypt哈希)
name        VARCHAR NOT NULL
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

### 书签表 (bookmarks)
```sql
id              SERIAL PRIMARY KEY
user_id         INTEGER REFERENCES users(id)
encrypted_data  TEXT NOT NULL (AES加密的JSON)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### 密码表 (passwords)
```sql
id              SERIAL PRIMARY KEY
user_id         INTEGER REFERENCES users(id)
encrypted_data  TEXT NOT NULL (AES加密的JSON)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

## API接口

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取用户信息

### 书签接口
- `GET /api/bookmarks` - 获取书签列表
- `POST /api/bookmarks` - 创建书签
- `PUT /api/bookmarks/:id` - 更新书签
- `DELETE /api/bookmarks/:id` - 删除书签
- `GET /api/bookmarks/search` - 搜索书签

### 密码接口
- `GET /api/passwords` - 获取密码列表（不含密码）
- `GET /api/passwords/:id` - 获取特定密码（含密码）
- `POST /api/passwords` - 创建密码
- `PUT /api/passwords/:id` - 更新密码
- `DELETE /api/passwords/:id` - 删除密码
- `GET /api/passwords/search` - 搜索密码

## 安全设计

### 数据加密
1. **传输加密**: HTTPS/TLS
2. **存储加密**: AES-256对敏感数据加密
3. **密码哈希**: bcrypt + salt

### 认证授权
1. **JWT令牌**: 7天有效期
2. **API限流**: 15分钟100次请求
3. **CORS配置**: 限制跨域访问

### 数据隔离
1. **用户隔离**: 每个用户只能访问自己的数据
2. **权限检查**: 所有API都需要身份验证
3. **SQL注入防护**: 使用参数化查询

## 部署架构

```
Internet
    ↓
[Nginx反向代理]
    ↓
[Docker网络]
    ├── Web前端容器 (React)
    ├── API后端容器 (Node.js)
    └── 数据库容器 (PostgreSQL)
```

### 容器配置
- **Web容器**: Nginx + 静态文件
- **API容器**: Node.js + Express
- **DB容器**: PostgreSQL + 数据持久化

### 网络配置
- **内部网络**: 容器间通信
- **外部端口**: 8080 (Web), 3000 (API)
- **数据库**: 仅内部访问

## 开发指南

### 本地开发环境
```bash
# 后端开发
cd backend
npm install
npm run dev

# 前端开发
cd web-client
npm install
npm run dev

# 数据库
docker run -d -p 5432:5432 -e POSTGRES_DB=bookmark_sync postgres:15
```

### 代码规范
- **ESLint**: JavaScript代码检查
- **Prettier**: 代码格式化
- **Git Hooks**: 提交前检查

### 测试策略
- **单元测试**: Jest + Supertest
- **集成测试**: API端到端测试
- **E2E测试**: Cypress (计划中)

## 扩展计划

### 短期目标 (1-3个月)
- [ ] 浏览器扩展开发
- [ ] 密码生成器功能
- [ ] 数据导入/导出
- [ ] 移动端应用完善

### 中期目标 (3-6个月)
- [ ] 桌面应用 (Electron)
- [ ] 团队共享功能
- [ ] 二次验证 (2FA)
- [ ] 审计日志

### 长期目标 (6-12个月)
- [ ] 企业版功能
- [ ] 单点登录 (SSO)
- [ ] 高可用部署
- [ ] 性能优化

## 贡献指南

### 开发流程
1. Fork项目
2. 创建功能分支
3. 提交代码
4. 创建Pull Request

### 代码提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试相关
chore: 构建/工具相关
```

### 问题反馈
- GitHub Issues
- 邮件联系
- 技术讨论群