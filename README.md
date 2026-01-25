# 书签密码同步应用

一个支持私有化部署的多端书签和密码同步应用。

## 功能特性

- 🔖 浏览器书签同步
- 🔐 密码管理和同步
- 🌐 多端支持（Web、移动端）
- 🔒 端到端加密
- 🏠 私有化部署
- 👥 多用户支持

## 技术栈

### 后端
- Node.js + Express
- PostgreSQL 数据库
- JWT 认证
- 端到端加密

### 前端
- React (Web端)
- React Native (移动端)
- Material-UI / Ant Design

### 部署
- Docker + Docker Compose
- Nginx 反向代理

## 前置要求

### PostgreSQL数据库
项目使用本地PostgreSQL数据库：
- **主机**: localhost:5432
- **用户**: postgres  
- **密码**: 123456
- **数据库**: bookmark_sync

请确保PostgreSQL已安装并运行。如需安装，请参考 [部署指南](docs/deployment.md#前置要求)。

## 快速开始

### 开发环境

```bash
# 后端开发
cd backend
npm install
npm run dev

# Web前端开发（新终端）
cd web-client
npm install
npm run dev

# 访问地址
# 前端: http://localhost:3002
# 后端: http://localhost:3001
```

## 项目结构

```
├── backend/          # 后端API服务
├── web-client/       # Web客户端
├── mobile-client/    # 移动端应用
├── docker/          # Docker配置
└── docs/            # 项目文档
```

## 使用说明

### 首次使用

1. **启动应用**: 运行 restart.sh
2. **访问Web界面**: 打开浏览器访问 http://localhost:3002
3. **注册账号**: 点击"立即注册"创建新账号
4. **开始使用**: 登录后即可管理书签和密码

### 功能介绍

#### 📚 书签管理
- **添加书签**: 输入标题、URL、分类和标签
- **搜索书签**: 支持标题、URL、描述全文搜索
- **分类管理**: 使用文件夹组织书签
- **标签系统**: 为书签添加多个标签便于查找

#### 🔐 密码管理
- **安全存储**: 所有密码使用AES-256加密存储
- **分类管理**: 按网站类型分类管理密码
- **快速搜索**: 根据网站名称快速查找密码
- **安全查看**: 密码默认隐藏，需要时才显示

### 安全特性

- **端到端加密**: 敏感数据在客户端加密后传输
- **密码哈希**: 用户密码使用bcrypt安全哈希
- **JWT认证**: 使用JSON Web Token进行身份验证
- **API限流**: 防止暴力破解和恶意请求

## 开源协议

本项目采用 MIT 协议开源，详见 [LICENSE](LICENSE) 文件。

## 贡献者

感谢所有为这个项目做出贡献的开发者！

---

**⭐ 如果这个项目对你有帮助，请给个Star支持一下！**