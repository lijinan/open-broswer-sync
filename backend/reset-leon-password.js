require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function resetPassword() {
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
    
    // 生成新密码哈希
    const newPassword = '123456';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // 更新leon用户的密码
    const result = await client.query(
      'UPDATE users SET password = $1, updated_at = $2 WHERE name = $3 RETURNING id, name, email',
      [hashedPassword, new Date(), 'leon']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ 密码重置成功');
      console.log('用户信息:', result.rows[0]);
      console.log('新密码: 123456');
    } else {
      console.log('❌ 未找到用户 leon');
    }
    
  } catch (error) {
    console.error('❌ 重置密码失败:', error.message);
  } finally {
    await client.end();
    process.exit(0);
  }
}

resetPassword();