const db = require('./src/config/database');

(async () => {
  try {
    // Test connection
    console.log('Testing database connection...');
    const result = await db.raw('SELECT NOW()');
    console.log('Database time:', result.rows[0]);
    
    // Query users
    const users = await db('users').select('id', 'email', 'name');
    console.log('\nUsers:', users);
    
    // Query bookmarks count
    const count = await db('bookmarks').where({ user_id: 1 }).count('* as count');
    console.log('\nBookmarks count for user_id=1:', count[0]);
    
    // Query actual bookmarks
    const bookmarks = await db('bookmarks')
      .where({ user_id: 1 })
      .orderBy('created_at', 'desc')
      .limit(3);
      
    console.log('\nFirst 3 bookmarks for user_id=1:');
    console.log(JSON.stringify(bookmarks, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
