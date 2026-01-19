require('dotenv').config();
const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log('尝试连接数据库...');
    console.log('配置:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD ? '***' : 'undefined'
    });
    
    await client.connect();
    console.log('✅ 数据库连接成功');
    
    // 检查用户表
    const result = await client.query('SELECT id, name, username, email FROM users LIMIT 5');
    console.log('用户数量:', result.rows.length);
    result.rows.forEach(user => {
      console.log('用户:', user);
    });
    
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
  } finally {
    await client.end();
    process.exit(0);
  }
}

testConnection();