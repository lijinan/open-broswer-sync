const { Client } = require('pg');
require('dotenv').config();

async function verifyDatabase() {
  console.log('🔍 验证数据库设置...');
  
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'bookmark_sync'
  });
  
  try {
    await client.connect();
    console.log('✅ 数据库连接成功');
    
    // 检查表是否存在
    const tablesResult = await client.query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 数据库表结构:');
    tablesResult.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name} (${row.column_count} 列)`);
    });
    
    // 检查索引
    const indexResult = await client.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      ORDER BY tablename, indexname
    `);
    
    console.log('\n🔗 数据库索引:');
    indexResult.rows.forEach(row => {
      console.log(`   ✓ ${row.tablename}.${row.indexname}`);
    });
    
    // 检查触发器
    const triggerResult = await client.query(`
      SELECT trigger_name, event_object_table 
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name
    `);
    
    console.log('\n⚡ 数据库触发器:');
    triggerResult.rows.forEach(row => {
      console.log(`   ✓ ${row.event_object_table}.${row.trigger_name}`);
    });
    
    // 测试插入和查询（创建测试用户）
    console.log('\n🧪 测试数据库操作...');
    
    // 检查是否已有测试用户
    const existingUser = await client.query(
      'SELECT id, email, name FROM users WHERE email = $1',
      ['test@database.com']
    );
    
    if (existingUser.rows.length === 0) {
      // 插入测试用户
      const insertResult = await client.query(`
        INSERT INTO users (email, password, name) 
        VALUES ($1, $2, $3) 
        RETURNING id, email, name, created_at
      `, ['test@database.com', 'hashed_password', '数据库测试用户']);
      
      console.log('   ✅ 测试用户创建成功:', insertResult.rows[0]);
    } else {
      console.log('   ℹ️  测试用户已存在:', existingUser.rows[0]);
    }
    
    // 统计数据
    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    const bookmarkCount = await client.query('SELECT COUNT(*) as count FROM bookmarks');
    const passwordCount = await client.query('SELECT COUNT(*) as count FROM passwords');
    
    console.log('\n📊 数据统计:');
    console.log(`   👥 用户数量: ${userCount.rows[0].count}`);
    console.log(`   🔖 书签数量: ${bookmarkCount.rows[0].count}`);
    console.log(`   🔐 密码数量: ${passwordCount.rows[0].count}`);
    
    await client.end();
    console.log('\n🎉 数据库验证完成！数据库已准备就绪。');
    
  } catch (error) {
    console.error('❌ 数据库验证失败:', error.message);
    console.error('详细错误:', error);
  }
}

verifyDatabase();