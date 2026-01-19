require('dotenv').config();
const { Client } = require('pg');

async function checkTableStructure() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('✅ 数据库连接成功');
    
    // 检查users表结构
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('users表结构:');
    result.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // 检查现有用户
    const users = await client.query('SELECT * FROM users LIMIT 3');
    console.log('\n现有用户:');
    users.rows.forEach(user => {
      console.log('用户:', user);
    });
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  } finally {
    await client.end();
    process.exit(0);
  }
}

checkTableStructure();