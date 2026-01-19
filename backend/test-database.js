const db = require('./src/config/database');

async function testDatabase() {
  console.log('🧪 测试数据库连接...');
  
  try {
    // 测试数据库连接
    const result = await db.raw('SELECT NOW() as current_time');
    console.log('✅ 数据库连接成功');
    console.log('⏰ 当前时间:', result.rows[0].current_time);
    
    // 测试表是否存在
    const tables = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 数据库表:');
    tables.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });
    
    // 测试用户表结构
    const userColumns = await db.raw(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('👤 用户表结构:');
    userColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    console.log('🎉 数据库测试完成！');
    
  } catch (error) {
    console.error('❌ 数据库测试失败:', error.message);
  } finally {
    await db.destroy();
  }
}

testDatabase();