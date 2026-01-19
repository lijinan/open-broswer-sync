# 部署指南

## 前置要求

### 本地PostgreSQL数据库
项目配置为使用本地PostgreSQL数据库：
- **主机**: localhost:5432
- **用户**: postgres
- **密码**: 123456
- **数据库**: bookmark_sync

### 安装PostgreSQL
**Windows:**
1. 下载PostgreSQL安装包: https://www.postgresql.org/download/windows/
2. 安装时设置postgres用户密码为 `123456`
3. 确保服务已启动

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo -u postgres psql -c "ALTER USER postgres PASSWORD '123456';"
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
psql postgres -c "ALTER USER postgres PASSWORD '123456';"
```

## 快速部署（推荐）

### 使用Docker Compose（生产环境）

1. **确保PostgreSQL运行**
```bash
# 检查PostgreSQL状态
pg_isready -h localhost -p 5432 -U postgres

# 如果未运行，启动PostgreSQL服务
# Windows: 在服务管理器中启动PostgreSQL服务
# Linux: sudo systemctl start postgresql
# macOS: brew services start postgresql
```

2. **克隆项目**
```bash
git clone <repository-url>
cd bookmark-sync
```

3. **初始化数据库**
```bash
# 创建数据库和表结构
psql -h localhost -p 5432 -U postgres -d postgres -f setup-database.sql
```

4. **启动服务**
```bash
# 启动应用服务
docker-compose up -d

# 查看服务状态
docker-compose ps
```

5. **访问应用**
- Web界面: http://localhost:8080
- API接口: http://localhost:3000

### 本地开发环境

**快速启动:**
```bash
# Windows
start-local-dev.bat

# Linux/Mac
chmod +x start-local-dev.sh && ./start-local-dev.sh
```

**手动启动:**
```bash
# 1. 初始化数据库
psql -h localhost -p 5432 -U postgres -d postgres -f setup-database.sql

# 2. 启动后端
cd backend
npm install
npm run dev

# 3. 启动前端（新终端）
cd web-client
npm install
npm run dev
```

## 手动部署

### 环境要求

- Node.js 18+
- PostgreSQL 12+
- Nginx (可选)

### 后端部署

1. **安装依赖**
```bash
cd backend
npm install
```

2. **配置数据库**
```bash
# 创建数据库
createdb bookmark_sync

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件
```

3. **运行迁移**
```bash
npm run migrate
```

4. **启动服务**
```bash
# 开发环境
npm run dev

# 生产环境
npm start
```

### 前端部署

1. **安装依赖**
```bash
cd web-client
npm install
```

2. **构建项目**
```bash
npm run build
```

3. **部署到Web服务器**
```bash
# 将 dist 目录内容复制到Web服务器根目录
cp -r dist/* /var/www/html/
```

## 生产环境配置

### 安全配置

1. **修改默认密钥**
```bash
# 生成强密码
openssl rand -base64 32

# 更新 .env 文件中的密钥
JWT_SECRET=your-generated-secret
ENCRYPTION_KEY=your-32-character-key
```

2. **配置HTTPS**
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:8080;
    }
}
```

3. **配置防火墙**
```bash
# 只开放必要端口
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

### 性能优化

1. **数据库优化**
```sql
-- 创建索引
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_passwords_user_id ON passwords(user_id);
```

2. **Nginx缓存配置**
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 备份与恢复

### 数据库备份

```bash
# 备份
pg_dump bookmark_sync > backup.sql

# 恢复
psql bookmark_sync < backup.sql
```

### 自动备份脚本

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="bookmark_sync"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
pg_dump $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete

echo "备份完成: $BACKUP_DIR/db_backup_$DATE.sql"
```

## 监控与日志

### 健康检查

```bash
# 检查服务状态
curl http://localhost:3000/health

# 检查数据库连接
docker-compose exec postgres psql -U postgres -d bookmark_sync -c "SELECT 1;"
```

### 日志管理

```bash
# 查看应用日志
docker-compose logs backend

# 实时查看日志
docker-compose logs -f backend

# 限制日志大小
echo '{"log-driver":"json-file","log-opts":{"max-size":"10m","max-file":"3"}}' > /etc/docker/daemon.json
```

## 故障排除

### 常见问题

1. **数据库连接失败**
```bash
# 检查数据库是否运行
docker-compose ps postgres

# 检查连接配置
docker-compose exec backend env | grep DB_
```

2. **前端无法访问API**
```bash
# 检查网络连接
docker-compose exec web curl http://backend:3000/health

# 检查Nginx配置
docker-compose exec nginx nginx -t
```

3. **内存不足**
```bash
# 增加交换空间
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### 性能监控

```bash
# 监控容器资源使用
docker stats

# 监控数据库性能
docker-compose exec postgres psql -U postgres -d bookmark_sync -c "
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;"
```