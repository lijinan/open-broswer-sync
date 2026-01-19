const db = require('./src/config/database');

async function checkUsers() {
  try {
    console.log('检查数据库中的用户...');
    
    const users = await db('users').select('id', 'name', 'username', 'email');
    
    console.log('找到用户数量:', users.length);
    users.forEach(user => {
      console.log('用户:', {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email
      });
    });
    
  } catch (error) {
    console.error('检查用户失败:', error);
  } finally {
    process.exit(0);
  }
}

checkUsers();