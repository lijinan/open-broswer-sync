const { Client } = require('pg');
require('dotenv').config();

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  database: 'postgres' // 先连接到默认数据库
};

const targetDatabase = process.env.DB_NAME || 'bookmark_sync';

// SQL语句
const createDatabaseSQL = `CREATE DATABASE ${targetDatabase}`;

const createTablesSQL = `
-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建书签表
CREATE TABLE IF NOT EXISTS bookmarks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    encrypted_data TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建密码表
CREATE TABLE IF NOT EXISTS passwords (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    encrypted_data TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_passwords_user_id ON passwords(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 添加触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookmarks_updated_at ON bookmarks;
CREATE TRIGGER update_bookmarks_updated_at 
    BEFORE UPDATE ON bookmarks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_passwords_updated_at ON passwords;
CREATE TRIGGER update_passwords_updated_at 
    BEFORE UPDATE ON passwords 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

async function initializeDatabase() {
  console.log('🚀 开始初始化数据库...');
  
  // 第一步：连接到PostgreSQL并创建数据库
  let client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ 成功连接到PostgreSQL服务器');
    
    // 检查数据库是否已存在
    const checkDbResult = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [targetDatabase]
    );
    
    if (checkDbResult.rows.length === 0) {
      // 数据库不存在，创建它
      await client.query(createDatabaseSQL);
      console.log(`✅ 数据库 "${targetDatabase}" 创建成功`);
    } else {
      console.log(`ℹ️  数据库 "${targetDatabase}" 已存在`);
    }
    
    await client.end();
    
  } catch (error) {
    console.error('❌ 创建数据库时出错:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 请确保PostgreSQL服务正在运行');
      console.error('💡 连接信息: localhost:5432, 用户: postgres, 密码: 123456');
    }
    process.exit(1);
  }
  
  // 第二步：连接到目标数据库并创建表
  const targetDbConfig = { ...dbConfig, database: targetDatabase };
  client = new Client(targetDbConfig);
  
  try {
    await client.connect();
    console.log(`✅ 成功连接到数据库 "${targetDatabase}"`);
    
    // 执行创建表的SQL
    await client.query(createTablesSQL);
    console.log('✅ 数据表创建成功');
    
    // 验证表是否创建成功
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 已创建的表:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    await client.end();
    console.log('🎉 数据库初始化完成！');
    
  } catch (error) {
    console.error('❌ 创建表时出错:', error.message);
    process.exit(1);
  }
}

// 运行初始化
if (require.main === module) {
  initializeDatabase().catch(console.error);
}

module.exports = { initializeDatabase };