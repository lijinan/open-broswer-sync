require('dotenv').config();

async function testBookmarkAPI() {
  const serverUrl = 'http://localhost:3001';
  
  try {
    // 1. 登录获取token
    console.log('1. 登录获取token...');
    const loginResponse = await fetch(`${serverUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'leon',
        password: '123456'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error('登录失败');
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ 登录成功，获得token');
    
    // 2. 测试创建书签
    console.log('2. 测试创建书签...');
    const testBookmark = {
      title: '测试书签',
      url: 'https://example.com',
      folder: '测试文件夹',
      tags: ['测试'],
      description: '这是一个测试书签'
    };
    
    const createResponse = await fetch(`${serverUrl}/bookmarks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testBookmark)
    });
    
    if (!createResponse.ok) {
      const error = await createResponse.json();
      throw new Error('创建书签失败: ' + JSON.stringify(error));
    }
    
    const createData = await createResponse.json();
    console.log('✅ 书签创建成功:', createData.bookmark.title);
    
    // 3. 测试获取书签
    console.log('3. 测试获取书签...');
    const getResponse = await fetch(`${serverUrl}/bookmarks`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!getResponse.ok) {
      throw new Error('获取书签失败');
    }
    
    const getData = await getResponse.json();
    console.log('✅ 获取书签成功，数量:', getData.bookmarks.length);
    
    // 4. 测试清空书签
    console.log('4. 测试清空书签...');
    const clearResponse = await fetch(`${serverUrl}/bookmarks/clear`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!clearResponse.ok) {
      const error = await clearResponse.json();
      throw new Error('清空书签失败: ' + JSON.stringify(error));
    }
    
    const clearData = await clearResponse.json();
    console.log('✅ 清空书签成功，删除数量:', clearData.deletedCount);
    
    console.log('\n🎉 所有书签API测试通过！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testBookmarkAPI();