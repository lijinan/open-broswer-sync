const db = require('./src/config/database');

async function createPasswordsTable() {
  try {
    // 检查表是否存在
    const exists = await db.schema.hasTable('passwords');
    
    if (exists) {
      console.log('✅ passwords表已存在');
      return;
    }
    
    // 创建passwords表
    await db.schema.createTable('passwords', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.text('encrypted_data').notNullable();
      table.timestamps(true, true);
      table.index('user_id');
    });
    
    console.log('✅ passwords表创建成功');
    
  } catch (error) {
    console.error('❌ 创建passwords表失败:', error);
  } finally {
    await db.destroy();
  }
}

createPasswordsTable();