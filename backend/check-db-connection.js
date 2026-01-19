const { Client } = require('pg');
require('dotenv').config();

async function testConnection(config, description) {
  console.log(`\n🔍 测试连接: ${description}`);
  console.log(`   主机: ${config.host}:${config.port}`);
  console.log(`   用户: ${config.user}`);
  console.log(`   数据库: ${config.database}`);
  
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('   ✅ 连接成功');
    
    const result = await client.query('SELECT version()');
    console.log(`   📊 PostgreSQL版本: ${result.rows[0].version.split(' ')[1]}`);
    
    await client.end();
    return true;
  } catch (error) {
    console.log(`   ❌ 连接失败: ${error.message}`);
    return false;
  }
}

async function checkDatabaseConnections() {
  console.log('🚀 检查PostgreSQL数据库连接...');
  
  const baseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
  };
  
  // 测试不同的连接配置
  const testConfigs = [
    {
      ...baseConfig,
      password: process.env.DB_PASSWORD || '123456',
      database: 'postgres',
      description: '默认数据库 (postgres) - 配置密码'
    },
    {
      ...baseConfig,
      password: '',
      database: 'postgres',
      description: '默认数据库 (postgres) - 无密码'
    },
    {
      ...baseConfig,
      password: 'postgres',
      database: 'postgres',
      description: '默认数据库 (postgres) - postgres密码'
    },
    {
      ...baseConfig,
      password: process.env.DB_PASSWORD || '123456',
      database: process.env.DB_NAME || 'bookmark_sync',
      description: '目标数据库 (bookmark_sync) - 配置密码'
    }
  ];
  
  let successCount = 0;
  
  for (const config of testConfigs) {
    const success = await testConnection(config, config.description);
    if (success) successCount++;
  }
  
  console.log(`\n📊 测试结果: ${successCount}/${testConfigs.length} 个连接成功`);
  
  if (successCount === 0) {
    console.log('\n💡 建议检查:');
    console.log('   1. PostgreSQL服务是否正在运行');
    console.log('   2. 用户名和密码是否正确');
    console.log('   3. 防火墙是否阻止了连接');
    console.log('   4. PostgreSQL配置是否允许本地连接');
  }
}

checkDatabaseConnections();