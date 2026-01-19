const bcrypt = require('bcryptjs');
const db = require('./src/config/database');

async function createTestUser() {
  try {
    console.log('正在创建测试用户...');
    
    // 检查用户是否已存在
    const existingUser = await db('users').where({ username: 'leon' }).first();
    if (existingUser) {
      console.log('用户 leon 已存在');
      console.log('用户信息:', {
        id: existingUser.id,
        name: existingUser.name,
        username: existingUser.username,
        email: existingUser.email
      });
      return;
    }
    
    // 创建测试用户
    const hashedPassword = await bcrypt.hash('123456', 12);
    
    const [user] = await db('users').insert({
      name: 'Leon Test',
      username: 'leon',
      email: 'leon@test.com',
      password_hash: hashedPassword,
      created_at: new Date(),
      updated_at: new Date()
    }).returning(['id', 'name', 'username', 'email']);
    
    console.log('测试用户创建成功:');
    console.log('姓名: Leon Test');
    console.log('用户名: leon');
    console.log('密码: 123456');
    console.log('邮箱: leon@test.com');
    console.log('用户ID:', user.id);
    
  } catch (error) {
    console.error('创建测试用户失败:', error);
  } finally {
    process.exit(0);
  }
}

createTestUser();