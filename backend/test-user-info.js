const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./src/config/database');
require('dotenv').config();

async function testUserInfo() {
  try {
    console.log('🧪 测试用户信息功能...');
    
    // 1. 创建或获取测试用户
    let user = await db('users').where({ email: 'leon@example.com' }).first();
    
    if (!user) {
      console.log('📝 创建测试用户...');
      const hashedPassword = await bcrypt.hash('password123', 12);
      
      [user] = await db('users').insert({
        email: 'leon@example.com',
        password: hashedPassword,
        name: 'Leon Test User',
        created_at: new Date(),
        updated_at: new Date()
      }).returning(['id', 'email', 'name']);
      
      console.log('✅ 测试用户创建成功');
    } else {
      console.log('ℹ️  测试用户已存在');
    }
    
    console.log('👤 用户信息:', {
      id: user.id,
      name: user.name,
      email: user.email
    });
    
    // 2. 生成新格式的JWT token
    console.log('\n🔑 生成JWT token...');
    const token = jwt.sign(
      { 
        id: user.id,
        userId: user.id, // 保持向后兼容
        name: user.name,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    // 3. 解析token验证内容
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ JWT token内容:', {
      id: decoded.id,
      userId: decoded.userId,
      name: decoded.name,
      email: decoded.email,
      exp: new Date(decoded.exp * 1000).toLocaleString()
    });
    
    console.log('\n📋 测试结果:');
    console.log('- 用户ID:', user.id);
    console.log('- 用户名:', user.name);
    console.log('- 邮箱:', user.email);
    console.log('- JWT包含完整信息:', !!(decoded.name && decoded.email));
    
    console.log('\n🔗 测试连接信息:');
    console.log('- 邮箱: leon@example.com');
    console.log('- 密码: password123');
    console.log('- Token:', token.substring(0, 50) + '...');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    process.exit(0);
  }
}

testUserInfo();